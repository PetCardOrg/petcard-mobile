import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AnexoResponseDto, EntidadeComAnexo } from '@petcardorg/shared';
import { isAxiosError } from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import { anexoService } from '../../services';
import {
  ANEXO_TAMANHO_MAXIMO_BYTES,
  formatarTamanho,
  mimeDoArquivo,
} from '../../utils/anexoArquivo';
import { colors, radii, spacing, typography } from '../../utils/theme';

interface Props {
  petId: string;
  entidade: EntidadeComAnexo;
  entidadeId: string;
  anexos: AnexoResponseDto[];
  /** Recarrega a lista do registro depois de anexar ou remover. */
  onChanged: () => void;
}

function mensagemDeErro(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.message) {
    const { message } = err.response.data as { message: string | string[] };
    return Array.isArray(message) ? message.join('\n') : String(message);
  }
  return fallback;
}

/**
 * Comprovantes de um registro de saúde (vacina, vermífugo ou medicação).
 *
 * O selo "verificado" só existe quando um veterinário com CRMV conferiu o
 * arquivo — é o que separa um comprovante que o próprio tutor anexou de um
 * que um profissional atestou.
 */
export function AnexosDoRegistro({ petId, entidade, entidadeId, anexos, onChanged }: Props) {
  const { t } = useTranslation();
  const [isSending, setIsSending] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function handleAdd() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('petDetails.permissionRequired'), t('anexos.permissaoGaleria'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;

    const nome = asset.fileName ?? asset.uri.split('/').pop() ?? 'comprovante.jpg';
    const mimeType = mimeDoArquivo(nome, asset.mimeType);
    if (!mimeType) {
      Alert.alert(t('common.error'), t('anexos.tipoInvalido'));
      return;
    }
    if (asset.fileSize && asset.fileSize > ANEXO_TAMANHO_MAXIMO_BYTES) {
      Alert.alert(t('common.error'), t('anexos.grandeDemais'));
      return;
    }

    setIsSending(true);
    try {
      await anexoService.uploadAnexo(
        petId,
        { entidade, entidadeId },
        { uri: asset.uri, name: nome, mimeType },
      );
      onChanged();
    } catch (err) {
      Alert.alert(t('common.error'), mensagemDeErro(err, t('anexos.erroEnviar')));
    } finally {
      setIsSending(false);
    }
  }

  async function handleOpen(anexo: AnexoResponseDto) {
    setOpeningId(anexo.id);
    try {
      const { url } = await anexoService.getLinkDoAnexo(anexo.id);
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      Alert.alert(t('common.error'), mensagemDeErro(err, t('anexos.erroAbrir')));
    } finally {
      setOpeningId(null);
    }
  }

  function confirmRemove(anexo: AnexoResponseDto) {
    // O aviso muda quando um veterinário já atestou o comprovante: o tutor
    // continua podendo removê-lo, mas sabe que perde o atestado da carteira.
    const mensagem = anexo.verificado
      ? t('anexos.removerVerificadoMensagem', { name: anexo.nome_arquivo })
      : t('anexos.removerMensagem', { name: anexo.nome_arquivo });

    Alert.alert(t('anexos.removerTitulo'), mensagem, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('petDetails.deleteDialog.confirm'),
        style: 'destructive',
        onPress: () => void handleRemove(anexo.id),
      },
    ]);
  }

  async function handleRemove(id: string) {
    try {
      await anexoService.deleteAnexo(id);
      onChanged();
    } catch (err) {
      Alert.alert(t('common.error'), mensagemDeErro(err, t('anexos.erroRemover')));
    }
  }

  return (
    <View style={styles.container} testID={`anexos-${entidadeId}`}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('anexos.titulo')}</Text>
        <Pressable
          accessibilityLabel={t('anexos.adicionar')}
          disabled={isSending}
          hitSlop={8}
          onPress={() => void handleAdd()}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          testID={`anexo-adicionar-${entidadeId}`}
        >
          {isSending ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <>
              <Ionicons color={colors.primaryDark} name="attach" size={16} />
              <Text style={styles.addButtonText}>{t('anexos.adicionar')}</Text>
            </>
          )}
        </Pressable>
      </View>

      {anexos.map((anexo) => (
        <View key={anexo.id} style={styles.row}>
          <Ionicons
            color={colors.muted}
            name={anexo.mime_type === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
            size={20}
          />
          <View style={styles.rowInfo}>
            <Text numberOfLines={1} style={styles.fileName}>
              {anexo.nome_arquivo}
            </Text>
            <Text style={styles.fileMeta}>
              {formatarTamanho(anexo.tamanho_bytes)} · {anexo.enviado_por_nome}
            </Text>
            {anexo.verificado ? (
              <View
                style={[styles.badge, styles.badgeVerified]}
                testID={`anexo-verificado-${anexo.id}`}
              >
                <Ionicons color={colors.success} name="shield-checkmark" size={12} />
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  {t('anexos.verificadoPor', {
                    name: anexo.verificado_por_nome,
                    crmv: anexo.verificado_por_crmv,
                  })}
                </Text>
              </View>
            ) : (
              <View
                style={[styles.badge, styles.badgePending]}
                testID={`anexo-pendente-${anexo.id}`}
              >
                <Ionicons color={colors.warning} name="time-outline" size={12} />
                <Text style={[styles.badgeText, { color: colors.warning }]}>
                  {t('anexos.aguardandoVerificacao')}
                </Text>
              </View>
            )}
          </View>
          <Pressable
            accessibilityLabel={t('anexos.abrir')}
            disabled={openingId === anexo.id}
            hitSlop={8}
            onPress={() => void handleOpen(anexo)}
            style={styles.iconButton}
            testID={`anexo-abrir-${anexo.id}`}
          >
            {openingId === anexo.id ? (
              <ActivityIndicator color={colors.primaryDark} size="small" />
            ) : (
              <Ionicons color={colors.primaryDark} name="open-outline" size={18} />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel={t('anexos.remover')}
            hitSlop={8}
            onPress={() => confirmRemove(anexo)}
            style={styles.iconButton}
            testID={`anexo-remover-${anexo.id}`}
          >
            <Ionicons color={colors.danger} name="trash-outline" size={18} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  fileMeta: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeVerified: {
    backgroundColor: colors.successSoft,
  },
  badgePending: {
    backgroundColor: colors.warningSoft,
  },
  badgeText: {
    ...typography.caption,
  },
  iconButton: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
});
