import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '../../components/ui/ErrorState';
import type { HomeStackParamList } from '../../navigation/types';
import { cardService, scanService } from '../../services';
import type { TagColeira } from '../../services/scan.service';
import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'ColeiraQr'>;

type Estado = 'carregando' | 'ok' | 'sem_tag' | 'erro';

/**
 * QR da coleira: o código que um estranho lê ao encontrar o pet na rua.
 *
 * Separado do QR da carteira de propósito. A carteira leva ao prontuário e é
 * do tutor e do veterinário; este leva a uma página que só mostra como
 * devolver o animal. Trocar um pelo outro na coleira exporia histórico clínico
 * a qualquer pessoa que apontasse a câmera.
 */
export function ColeiraQrScreen({ route }: Props) {
  const { t } = useTranslation();
  const { petId, petName } = route.params;

  const [tag, setTag] = useState<TagColeira | null>(null);
  const [estado, setEstado] = useState<Estado>('carregando');
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      setTag(await scanService.getTag(petId));
      setEstado('ok');
    } catch (err) {
      // 404 não é falha: é pet cadastrado antes da coleira existir, e o tutor
      // resolve na própria tela.
      setEstado(isAxiosError(err) && err.response?.status === 404 ? 'sem_tag' : 'erro');
    }
  }, [petId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  async function gerar() {
    setGerando(true);
    try {
      // Mesma rota que a carteira usa: ela reenfileira a geração e o consumer
      // produz os dois QRs de uma vez.
      await cardService.regenerateQrCode(petId);
      Alert.alert(t('coleiraQr.requestedTitle'), t('coleiraQr.requestedMessage'));
    } catch {
      Alert.alert(t('common.error'), t('coleiraQr.generateError'));
    } finally {
      setGerando(false);
    }
  }

  async function compartilhar() {
    if (!tag) return;
    try {
      await Share.share({
        message: t('coleiraQr.shareMessage', { name: petName, url: tag.public_url }),
        url: tag.public_url,
      });
    } catch {
      // Cancelar o compartilhamento não é erro.
    }
  }

  if (estado === 'carregando') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (estado === 'erro') {
    return (
      <View style={styles.centered}>
        <ErrorState message={t('coleiraQr.error')} onRetry={() => void carregar()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('coleiraQr.title', { name: petName })}</Text>
      <Text style={styles.subtitle}>{t('coleiraQr.subtitle')}</Text>

      {estado === 'ok' && tag?.qr_code_url ? (
        <>
          <View style={styles.qrCard}>
            <Image
              accessibilityLabel={t('coleiraQr.imageAccessibility')}
              resizeMode="contain"
              source={{ uri: tag.qr_code_url }}
              style={styles.qrImage}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void compartilhar()}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          >
            <Ionicons color={colors.white} name="share-outline" size={18} />
            <Text style={styles.primaryBtnText}>{t('coleiraQr.share')}</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons color={colors.muted} name="qr-code-outline" size={40} />
          <Text style={styles.emptyText}>{t('coleiraQr.notGeneratedYet')}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={gerando}
            onPress={() => void gerar()}
            style={({ pressed }) => [
              styles.primaryBtn,
              gerando && styles.disabledBtn,
              pressed && !gerando && styles.pressed,
            ]}
            testID="gerar-qr-coleira"
          >
            {gerando ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons color={colors.white} name="qr-code-outline" size={18} />
                <Text style={styles.primaryBtnText}>{t('coleiraQr.generate')}</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <View style={styles.hintBox}>
        <Ionicons color={colors.primaryDark} name="information-circle-outline" size={18} />
        <Text style={styles.hintText}>{t('coleiraQr.privacyHint')}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  qrImage: {
    height: 240,
    width: 240,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.white,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  hintBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  hintText: {
    ...typography.caption,
    color: colors.primaryDark,
    flex: 1,
  },
  pressed: {
    opacity: 0.82,
  },
});
