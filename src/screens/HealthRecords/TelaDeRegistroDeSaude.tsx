import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type DimensionValue,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AnexoResponseDto, EntidadeComAnexo, PetResponseDto } from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { AnexosDoRegistro } from '../../components/domain/AnexosDoRegistro';
import { PetHeader } from '../../components/domain/PetHeader';
import { PetSelector } from '../../components/domain/PetSelector';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { useSelectedPet, type EscopoDeSelecao } from '../../contexts/SelectedPetContext';
import { usePets } from '../../hooks/usePets';
import { formatDateInput, parseDate } from '../../utils/dateUtils';
import {
  confirmarAcaoEmRegistroDeVet,
  ehRegistroDeVeterinario,
  type RegistroComAutor,
} from '../../utils/vetRecordGuard';
import { colors, radii, spacing, typography } from '../../utils/theme';
import { apiErrorMessage } from '../../utils/apiErrorMessage';

type IconeIonicons = keyof typeof Ionicons.glyphMap;

export type RegistroDeSaude = RegistroComAutor & {
  id: string;
  pet_id: string;
  anexos?: AnexoResponseDto[];
};

/** Um campo do formulário. Os valores circulam como texto, do jeito que o tutor digita. */
export type CampoDoFormulario = {
  chave: string;
  /** Chaves do i18n. */
  rotulo: string;
  placeholder: string;
  /** `data` usa a máscara DD/MM/AAAA; `notas` é o texto longo do fim. */
  tipo: 'texto' | 'data' | 'notas';
  autoCapitalize?: 'words';
  /** Chave da mensagem de obrigatório; sem ela, o campo é opcional. */
  obrigatorio?: string;
};

export type ValoresDoFormulario = Record<string, string>;

/** O que muda de uma tela de saúde para outra. */
export type ConfigDaTelaDeSaude<R extends RegistroDeSaude> = {
  escopo: EscopoDeSelecao;
  /** Prefixo das chaves do i18n da tela, ex. `healthRecords.vaccine`. */
  prefixo: string;
  seletor: { subtitulo: string; vazio: string };
  iconeDoVazio: IconeIonicons;
  /** Chave do rótulo do botão que confirma a exclusão. */
  confirmarExclusao: string;
  entidade: EntidadeComAnexo;
  campos: CampoDoFormulario[];
  nome: (registro: R) => string;
  icone: (registro: R) => { name: IconeIonicons; color: string };
  /** Selo ao lado do nome no card, ex. o status da medicação. */
  selo?: (registro: R, t: TFunction) => ReactNode;
  detalhes: (registro: R, t: TFunction) => ReactNode;
  /** Altura máxima do formulário; o padrão é 85% da tela. */
  alturaMaximaDoModal?: DimensionValue;
  paraFormulario: (registro: R) => ValoresDoFormulario;
  carregar: (petId: string) => Promise<R[]>;
  criar: (valores: ValoresDoFormulario, petId: string) => Promise<unknown>;
  atualizar: (id: string, valores: ValoresDoFormulario) => Promise<unknown>;
  apagar: (id: string) => Promise<void>;
};

/** Linha de detalhe do card: ícone e texto. */
export function LinhaDeDetalhe({
  icone,
  cor = colors.muted,
  numberOfLines,
  expandir,
  children,
}: {
  icone: IconeIonicons;
  cor?: string;
  numberOfLines?: number;
  /** Texto ocupa o resto da linha, para quebrar dentro do card. */
  expandir?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.cardDetailRow}>
      <Ionicons color={cor} name={icone} size={16} />
      <Text style={[styles.cardDetailText, expandir && styles.flex1]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );
}

/** Data ISO (AAAA-MM-DD…) no formato do campo, DD/MM/AAAA. */
export function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function formularioVazio(campos: CampoDoFormulario[]): ValoresDoFormulario {
  return Object.fromEntries(campos.map((campo) => [campo.chave, '']));
}

/**
 * Lista, formulário e exclusão de um tipo de registro de saúde do pet.
 * Vacina, vermífugo e medicação só mudam a configuração (AUD MOB-06).
 */
export function TelaDeRegistroDeSaude<R extends RegistroDeSaude>({
  config,
}: {
  config: ConfigDaTelaDeSaude<R>;
}) {
  const { t } = useTranslation();
  const { pets, isLoading: isPetsLoading } = usePets();
  const { prefixo, campos } = config;

  // Cada aba lembra o próprio pet. Resolvido na lista já carregada: pet
  // renomeado aparece com o nome novo e pet excluído devolve o tutor para
  // a seleção.
  const { selectedPetId, selectPet, clearSelection } = useSelectedPet(config.escopo);
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null;
  const [registros, setRegistros] = useState<R[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<R | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valores, setValores] = useState<ValoresDoFormulario>(() => formularioVazio(campos));
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  const { carregar } = config;
  const loadRegistros = useCallback(
    async (mode?: 'initial' | 'refresh') => {
      if (!selectedPetId) return;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await carregar(selectedPetId);
        setRegistros(data);
      } catch (err) {
        const message = apiErrorMessage(err, t(`${prefixo}.errorLoad`), t);
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [carregar, prefixo, selectedPetId, t],
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedPetId) {
        void loadRegistros();
      }
    }, [loadRegistros, selectedPetId]),
  );

  function handleSelectPet(pet: PetResponseDto) {
    selectPet(pet);
    setRegistros([]);
    setError(null);
  }

  function resetForm() {
    setValores(formularioVazio(campos));
    setFormErrors({});
    setEditingRecord(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(record: R) {
    // Registro de veterinário avisa antes de abrir o formulário (mobile#58).
    confirmarAcaoEmRegistroDeVet({
      registro: record,
      nomeDoRegistro: config.nome(record),
      acao: 'editar',
      t,
      onConfirm: () => abrirFormularioDeEdicao(record),
    });
  }

  function abrirFormularioDeEdicao(record: R) {
    setEditingRecord(record);
    setValores(config.paraFormulario(record));
    setFormErrors({});
    setModalVisible(true);
  }

  function confirmDelete(record: R) {
    // Registro de veterinário troca o texto da confirmação, em vez de somar
    // um segundo diálogo em cima do que já existia (mobile#58).
    if (ehRegistroDeVeterinario(record)) {
      confirmarAcaoEmRegistroDeVet({
        registro: record,
        nomeDoRegistro: config.nome(record),
        acao: 'apagar',
        t,
        onConfirm: () => void handleDelete(record.id),
      });
      return;
    }

    Alert.alert(
      t(`${prefixo}.deleteTitle`),
      t(`${prefixo}.deleteMessage`, { name: config.nome(record) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t(config.confirmarExclusao),
          style: 'destructive',
          onPress: () => void handleDelete(record.id),
        },
      ],
    );
  }

  async function handleDelete(id: string) {
    try {
      await config.apagar(id);
      void loadRegistros();
    } catch (err) {
      const message = apiErrorMessage(err, t(`${prefixo}.errorDelete`), t);
      Alert.alert(t('common.error'), message);
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    for (const campo of campos) {
      const valor = valores[campo.chave] ?? '';
      if (campo.obrigatorio && !valor.trim()) {
        errors[campo.chave] = t(campo.obrigatorio);
      } else if (campo.tipo === 'data' && valor.trim() && !parseDate(valor)) {
        errors[campo.chave] = t('validation.dateInvalid');
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedPet) return;

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await config.atualizar(editingRecord.id, valores);
        setModalVisible(false);
        Alert.alert(t('common.success'), t(`${prefixo}.successEdit`));
      } else {
        await config.criar(valores, selectedPet.id);
        setModalVisible(false);
        Alert.alert(t('common.success'), t(`${prefixo}.successCreate`));
      }
      void loadRegistros();
    } catch (err) {
      const message = apiErrorMessage(
        err,
        editingRecord ? t(`${prefixo}.errorEdit`) : t(`${prefixo}.errorCreate`),
        t,
      );
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function mudarCampo(campo: CampoDoFormulario, texto: string) {
    setValores((v) => ({
      ...v,
      [campo.chave]: campo.tipo === 'data' ? formatDateInput(texto) : texto,
    }));
    if (formErrors[campo.chave]) setFormErrors((e) => ({ ...e, [campo.chave]: undefined }));
  }

  // --- Pet selector ---
  if (!selectedPet) {
    return (
      <PetSelector
        pets={pets}
        isLoading={isPetsLoading}
        onSelectPet={handleSelectPet}
        subtitle={t(config.seletor.subtitulo)}
        emptyDescription={t(config.seletor.vazio)}
      />
    );
  }

  // --- List ---
  function renderItem({ item }: { item: R }) {
    const icone = config.icone(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons color={icone.color} name={icone.name} size={20} />
          <Text style={styles.cardName}>{config.nome(item)}</Text>
          {config.selo?.(item, t)}
          <Pressable onPress={() => openEditModal(item)} hitSlop={8} style={styles.actionButton}>
            <Ionicons color={colors.primaryDark} name="create-outline" size={18} />
          </Pressable>
          <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.actionButton}>
            <Ionicons color={colors.danger} name="trash-outline" size={18} />
          </Pressable>
        </View>

        <View style={styles.cardDetails}>{config.detalhes(item, t)}</View>

        <AnexosDoRegistro
          petId={item.pet_id}
          entidade={config.entidade}
          entidadeId={item.id}
          anexos={item.anexos ?? []}
          onChanged={() => void loadRegistros('refresh')}
        />
      </View>
    );
  }

  function renderCampo(campo: CampoDoFormulario) {
    const erro = formErrors[campo.chave];
    const valor = valores[campo.chave] ?? '';

    if (campo.tipo === 'notas') {
      return (
        <View key={campo.chave} style={styles.field}>
          <Text style={styles.label}>{t(campo.rotulo)}</Text>
          <TextInput
            multiline
            numberOfLines={3}
            onChangeText={(text) => mudarCampo(campo, text)}
            placeholder={t(campo.placeholder)}
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={valor}
          />
        </View>
      );
    }

    const ehData = campo.tipo === 'data';
    return (
      <View key={campo.chave} style={styles.field}>
        <Text style={styles.label}>{t(campo.rotulo)}</Text>
        <TextInput
          autoCapitalize={campo.autoCapitalize}
          keyboardType={ehData ? 'number-pad' : undefined}
          maxLength={ehData ? 10 : undefined}
          onChangeText={(text) => mudarCampo(campo, text)}
          placeholder={t(campo.placeholder)}
          placeholderTextColor={colors.muted}
          style={[styles.input, erro ? styles.inputError : null]}
          value={valor}
        />
        {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pet header */}
      <PetHeader petName={selectedPet.name} onBack={clearSelection} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ErrorState message={error} onRetry={() => void loadRegistros()} />
        </View>
      ) : registros.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon={config.iconeDoVazio}
            title={t(`${prefixo}.emptyTitle`)}
            description={t(`${prefixo}.emptyDescription`)}
            actionLabel={t(`${prefixo}.emptyAction`)}
            onActionPress={openCreateModal}
          />
        </View>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadRegistros('refresh')}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {!isLoading && !error && registros.length > 0 ? (
        <FAB accessibilityLabel={t(`${prefixo}.addAccessibility`)} onPress={openCreateModal} />
      ) : null}

      {/* Form Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View
              style={[
                styles.modalContent,
                config.alturaMaximaDoModal ? { maxHeight: config.alturaMaximaDoModal } : null,
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingRecord ? t(`${prefixo}.editTitle`) : t(`${prefixo}.createTitle`)}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {campos.map(renderCampo)}

                {/* Submit */}
                <Pressable
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingRecord ? t(`${prefixo}.submitEdit`) : t(`${prefixo}.submitCreate`)}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  // List
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl + 60,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  actionButton: {
    padding: spacing.xs,
  },
  cardDetails: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardDetailText: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  flex1: {
    flex: 1,
  },

  // Modal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },

  // Form
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
