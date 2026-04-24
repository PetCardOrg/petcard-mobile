import { useCallback, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  CreateDewormingRecordDto,
  DewormingRecordResponseDto,
  PetResponseDto,
} from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { PetHeader } from '../../components/domain/PetHeader';
import { PetSelector } from '../../components/domain/PetSelector';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { usePets } from '../../hooks/usePets';
import { dewormingService } from '../../services';
import { formatDateDisplay, formatDateInput, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';

type FormErrors = {
  productName?: string;
  appliedAt?: string;
  nextDoseAt?: string;
};

function isoToDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function DewormingScreen() {
  const { pets, isLoading: isPetsLoading } = usePets();

  const [selectedPet, setSelectedPet] = useState<PetResponseDto | null>(null);
  const [dewormings, setDewormings] = useState<DewormingRecordResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DewormingRecordResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productName, setProductName] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [nextDoseAt, setNextDoseAt] = useState('');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadDewormings = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!selectedPet) return;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await dewormingService.getDewormingsByPet(selectedPet.id);
        setDewormings(data);
      } catch (err) {
        let message = 'Não foi possível carregar as vermifugações.';
        if (isAxiosError(err) && err.response?.data?.message) {
          message = String(err.response.data.message);
        }
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPet],
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedPet) {
        void loadDewormings();
      }
    }, [loadDewormings, selectedPet]),
  );

  function handleSelectPet(pet: PetResponseDto) {
    setSelectedPet(pet);
    setDewormings([]);
    setError(null);
  }

  function resetForm() {
    setProductName('');
    setAppliedAt('');
    setNextDoseAt('');
    setVeterinarianName('');
    setNotes('');
    setFormErrors({});
    setEditingRecord(null);
  }

  function openCreateModal() {
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(record: DewormingRecordResponseDto) {
    setEditingRecord(record);
    setProductName(record.product_name);
    setAppliedAt(isoToDisplay(record.applied_at));
    setNextDoseAt(record.next_dose_at ? isoToDisplay(record.next_dose_at) : '');
    setVeterinarianName(record.veterinarian_name ?? '');
    setNotes(record.notes ?? '');
    setFormErrors({});
    setModalVisible(true);
  }

  function confirmDelete(record: DewormingRecordResponseDto) {
    Alert.alert('Excluir vermifugação', `Deseja excluir o registro de "${record.product_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => void handleDelete(record.id),
      },
    ]);
  }

  async function handleDelete(id: string) {
    try {
      await dewormingService.deleteDeworming(id);
      void loadDewormings();
    } catch (err) {
      let message = 'Não foi possível excluir a vermifugação.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    }
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!productName.trim()) errors.productName = 'Nome do medicamento é obrigatório';
    if (!appliedAt.trim()) {
      errors.appliedAt = 'Data de aplicação é obrigatória';
    } else if (!parseDate(appliedAt)) {
      errors.appliedAt = 'Data inválida. Use DD/MM/AAAA';
    }
    if (nextDoseAt.trim() && !parseDate(nextDoseAt)) {
      errors.nextDoseAt = 'Data inválida. Use DD/MM/AAAA';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedPet) return;

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await dewormingService.updateDeworming(editingRecord.id, {
          product_name: productName.trim(),
          applied_at: parseDate(appliedAt)!,
          next_dose_at: nextDoseAt.trim() ? parseDate(nextDoseAt) : undefined,
          veterinarian_name: veterinarianName.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setModalVisible(false);
        Alert.alert('Sucesso', 'Vermifugação atualizada com sucesso!');
      } else {
        const payload: CreateDewormingRecordDto = {
          pet_id: selectedPet.id,
          product_name: productName.trim(),
          applied_at: parseDate(appliedAt)!,
        };

        const parsedNextDose = nextDoseAt.trim() ? parseDate(nextDoseAt) : undefined;
        if (parsedNextDose) payload.next_dose_at = parsedNextDose;
        if (veterinarianName.trim()) payload.veterinarian_name = veterinarianName.trim();
        if (notes.trim()) payload.notes = notes.trim();

        await dewormingService.createDeworming(payload);
        setModalVisible(false);
        Alert.alert('Sucesso', 'Vermifugação registrada com sucesso!');
      }
      void loadDewormings();
    } catch (err) {
      let message = editingRecord
        ? 'Não foi possível atualizar a vermifugação.'
        : 'Não foi possível registrar a vermifugação. Tente novamente.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Pet selector ---
  if (!selectedPet) {
    return (
      <PetSelector
        pets={pets}
        isLoading={isPetsLoading}
        onSelectPet={handleSelectPet}
        subtitle="Escolha o pet para visualizar e registrar vermifugações."
        emptyDescription="Cadastre um pet primeiro para registrar vermifugações."
      />
    );
  }

  // --- Deworming list ---
  function renderDewormingItem({ item }: { item: DewormingRecordResponseDto }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons color={colors.success} name="shield-checkmark" size={20} />
          <Text style={styles.cardName}>{item.product_name}</Text>
          <Pressable onPress={() => openEditModal(item)} hitSlop={8} style={styles.actionButton}>
            <Ionicons color={colors.primaryDark} name="create-outline" size={18} />
          </Pressable>
          <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.actionButton}>
            <Ionicons color={colors.danger} name="trash-outline" size={18} />
          </Pressable>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardDetailRow}>
            <Ionicons color={colors.muted} name="calendar-outline" size={16} />
            <Text style={styles.cardDetailText}>
              Aplicada em {formatDateDisplay(item.applied_at)}
            </Text>
          </View>

          {item.next_dose_at ? (
            <View style={styles.cardDetailRow}>
              <Ionicons color={colors.warning} name="time-outline" size={16} />
              <Text style={styles.cardDetailText}>
                Próxima dose: {formatDateDisplay(item.next_dose_at)}
              </Text>
            </View>
          ) : null}

          {item.veterinarian_name ? (
            <View style={styles.cardDetailRow}>
              <Ionicons color={colors.muted} name="person-outline" size={16} />
              <Text style={styles.cardDetailText}>{item.veterinarian_name}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pet header */}
      <PetHeader petName={selectedPet.name} onBack={() => setSelectedPet(null)} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ErrorState message={error} onRetry={() => void loadDewormings()} />
        </View>
      ) : dewormings.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="shield-outline"
            title="Nenhuma vermifugação registrada"
            description="Registre a primeira vermifugação do seu pet."
            actionLabel="Adicionar vermifugação"
            onActionPress={openCreateModal}
          />
        </View>
      ) : (
        <FlatList
          data={dewormings}
          keyExtractor={(item) => item.id}
          renderItem={renderDewormingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadDewormings('refresh')}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {!isLoading && !error && dewormings.length > 0 ? (
        <FAB accessibilityLabel="Adicionar vermifugação" onPress={openCreateModal} />
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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingRecord ? 'Editar vermifugação' : 'Nova vermifugação'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Product name */}
                <View style={styles.field}>
                  <Text style={styles.label}>Nome do medicamento *</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={(t) => {
                      setProductName(t);
                      if (formErrors.productName)
                        setFormErrors((e) => ({ ...e, productName: undefined }));
                    }}
                    placeholder="Ex: Drontal, Milbemax, Endogard..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.productName ? styles.inputError : null]}
                    value={productName}
                  />
                  {formErrors.productName ? (
                    <Text style={styles.errorText}>{formErrors.productName}</Text>
                  ) : null}
                </View>

                {/* Applied at */}
                <View style={styles.field}>
                  <Text style={styles.label}>Data de aplicação *</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setAppliedAt(formatDateInput(t));
                      if (formErrors.appliedAt)
                        setFormErrors((e) => ({ ...e, appliedAt: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.appliedAt ? styles.inputError : null]}
                    value={appliedAt}
                  />
                  {formErrors.appliedAt ? (
                    <Text style={styles.errorText}>{formErrors.appliedAt}</Text>
                  ) : null}
                </View>

                {/* Next dose */}
                <View style={styles.field}>
                  <Text style={styles.label}>Próxima dose</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setNextDoseAt(formatDateInput(t));
                      if (formErrors.nextDoseAt)
                        setFormErrors((e) => ({ ...e, nextDoseAt: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.nextDoseAt ? styles.inputError : null]}
                    value={nextDoseAt}
                  />
                  {formErrors.nextDoseAt ? (
                    <Text style={styles.errorText}>{formErrors.nextDoseAt}</Text>
                  ) : null}
                </View>

                {/* Veterinarian */}
                <View style={styles.field}>
                  <Text style={styles.label}>Veterinário</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setVeterinarianName}
                    placeholder="Nome do veterinário"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={veterinarianName}
                  />
                </View>

                {/* Notes */}
                <View style={styles.field}>
                  <Text style={styles.label}>Observações</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    onChangeText={setNotes}
                    placeholder="Observações adicionais..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.textArea]}
                    textAlignVertical="top"
                    value={notes}
                  />
                </View>

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
                      {editingRecord ? 'Salvar alterações' : 'Registrar vermifugação'}
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
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
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
