import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CarteiraDigitalResponseDto } from '@petcardorg/shared';
import { Species } from '@petcardorg/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ErrorState } from '../../components/ui/ErrorState';
import type { HomeStackParamList } from '../../navigation/types';
import { cardService } from '../../services';
import { calculateAge } from '../../utils/calculateAge';
import { getPhotoUrl, SEX_CONFIG, SPECIES_CONFIG } from '../../utils/petConfig';
import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'DigitalWallet'>;

function SummaryCard({
  icon,
  label,
  secondaryLabel,
  primaryValue,
  secondaryValue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  secondaryLabel: string;
  primaryValue: number | null;
  secondaryValue: number | null;
}) {
  const isUnavailable = primaryValue == null || secondaryValue == null;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons color={colors.primary} name={icon} size={18} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      {isUnavailable ? (
        <>
          <Text style={styles.summaryUnavailableValue}>Indisponível</Text>
          <Text style={styles.summaryUnavailableHint}>Atualize para tentar novamente</Text>
        </>
      ) : (
        <>
          <Text style={styles.summaryValue}>{primaryValue}</Text>
          <Text style={styles.summarySecondary}>
            {secondaryValue} {secondaryLabel}
          </Text>
        </>
      )}
    </View>
  );
}

export function DigitalWalletScreen({ route }: Props) {
  const [wallet, setWallet] = useState<CarteiraDigitalResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [qrCacheBust, setQrCacheBust] = useState(() => Date.now());
  const isScreenActiveRef = useRef(false);

  const loadWallet = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        setError(false);

        const data = await cardService.getDigitalWallet(route.params.petId);

        if (!isScreenActiveRef.current) return;

        setWallet(data);
        if (data.qr_code_url) {
          setQrCacheBust(Date.now());
        }
        return data;
      } catch {
        if (!isScreenActiveRef.current) return;
        setError(true);
        return null;
      } finally {
        if (!isScreenActiveRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [route.params.petId],
  );

  useFocusEffect(
    useCallback(() => {
      isScreenActiveRef.current = true;
      void loadWallet();

      return () => {
        isScreenActiveRef.current = false;
      };
    }, [loadWallet]),
  );

  const wait = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

  const pollWalletAfterRegeneration = useCallback(
    async (hadQrCodeBefore: boolean) => {
      const attempts = hadQrCodeBefore ? 3 : 5;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        await wait(2000);
        const data = await loadWallet('refresh');

        if (!isScreenActiveRef.current) return;

        if (!hadQrCodeBefore && data?.qr_code_url) {
          return;
        }
      }
    },
    [loadWallet, wait],
  );

  async function handleRegenerate() {
    if (!wallet) return;

    Alert.alert(
      'Regenerar QR Code',
      'O QR Code atual será substituído por um novo. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          onPress: async () => {
            setIsRegenerating(true);
            try {
              const hadQrCodeBefore = !!wallet.qr_code_url;
              await cardService.regenerateQrCode(wallet.pet_id);
              Alert.alert(
                'QR Code solicitado',
                'Um novo QR Code está sendo gerado. Vamos atualizar esta tela por alguns segundos para buscar a versão mais recente.',
              );
              await pollWalletAfterRegeneration(hadQrCodeBefore);
            } catch (err) {
              let message = 'Não foi possível regenerar o QR Code.';
              if (isAxiosError(err) && err.response?.data?.message) {
                message = String(err.response.data.message);
              }
              Alert.alert('Erro', message);
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ],
    );
  }

  async function handleShare() {
    if (!wallet?.public_url) {
      Alert.alert(
        'Link indisponível',
        'A carteira digital ainda não possui um link público. Tente regenerar o QR Code.',
      );
      return;
    }

    try {
      const result = await Share.share({
        message: `Veja a carteira digital de ${wallet.pet_name}: ${wallet.public_url}`,
      });

      if (result.action === Share.dismissedAction) {
        return;
      }
    } catch {
      Alert.alert(
        'Erro ao compartilhar',
        'Não foi possível abrir o compartilhamento da carteira digital.',
      );
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !wallet) {
    return (
      <View style={styles.centeredPadded}>
        <ErrorState message="Não foi possível carregar a carteira digital." onRetry={loadWallet} />
      </View>
    );
  }

  const species = SPECIES_CONFIG[wallet.species] ?? SPECIES_CONFIG[Species.OTHER];
  const sex = SEX_CONFIG[wallet.sex];
  const age = calculateAge(wallet.birth_date);
  const photoUrl = getPhotoUrl(wallet);
  const rawQrCodeUrl = wallet.qr_code_url;
  const hasQrCode = !!rawQrCodeUrl;
  const qrImageUrl = rawQrCodeUrl
    ? `${rawQrCodeUrl}${rawQrCodeUrl.includes('?') ? '&' : '?'}t=${qrCacheBust}`
    : null;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void loadWallet('refresh')}
          tintColor={colors.primary}
        />
      }
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cardHeader}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: species.backgroundColor }]}>
            <MaterialCommunityIcons color={species.color} name={species.icon} size={32} />
          </View>
        )}
        <View style={styles.petInfo}>
          <Text style={styles.petName} numberOfLines={1}>
            {wallet.pet_name}
          </Text>
          {wallet.breed ? (
            <Text style={styles.petBreed} numberOfLines={1}>
              {wallet.breed}
            </Text>
          ) : null}
          <View style={styles.petMeta}>
            <View style={[styles.speciesPill, { backgroundColor: species.backgroundColor }]}>
              <MaterialCommunityIcons color={species.color} name={species.icon} size={14} />
              <Text style={[styles.speciesText, { color: species.color }]}>{species.label}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons color={colors.muted} name={sex.icon} size={14} />
              <Text style={styles.metaText}>{sex.label}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons color={colors.primary} name="calendar-outline" size={20} />
          <Text style={styles.statLabel}>Idade</Text>
          <Text style={styles.statValue}>{age}</Text>
        </View>
        {wallet.weight != null ? (
          <View style={styles.statCard}>
            <Ionicons color={colors.primary} name="fitness-outline" size={20} />
            <Text style={styles.statLabel}>Peso</Text>
            <Text style={styles.statValue}>{wallet.weight} kg</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>QR Code da Carteira</Text>
        <Text style={styles.sectionDescription}>
          Escaneie o QR Code para acessar o histórico de saúde do pet.
        </Text>

        {hasQrCode && qrImageUrl ? (
          <View style={styles.qrContainer}>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.qrPlaceholder}>
            <Ionicons color={colors.muted} name="qr-code-outline" size={48} />
            <Text style={styles.qrPlaceholderText}>
              QR Code ainda não gerado. Aguarde alguns instantes ou solicite uma nova geração.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumo de Saúde</Text>
        <Text style={styles.sectionDescription}>
          Visão rápida dos registros de vacinas, vermífugos e medicações do pet.
        </Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="medkit-outline"
            label="Vacinas"
            primaryValue={wallet.vaccines_count}
            secondaryLabel="com próxima dose"
            secondaryValue={wallet.upcoming_vaccines_count}
          />
          <SummaryCard
            icon="bug-outline"
            label="Vermífugos"
            primaryValue={wallet.dewormings_count}
            secondaryLabel="com próxima dose"
            secondaryValue={wallet.upcoming_dewormings_count}
          />
          <SummaryCard
            icon="bandage-outline"
            label="Medicações"
            primaryValue={wallet.medications_count}
            secondaryLabel="ativas"
            secondaryValue={wallet.active_medications_count}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityLabel="Compartilhar link da carteira digital"
          accessibilityRole="button"
          disabled={!wallet.public_url}
          onPress={handleShare}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.shareBtn,
            !wallet.public_url && styles.disabledBtn,
            pressed && !!wallet.public_url && styles.pressed,
          ]}
        >
          <Ionicons color={colors.white} name="share-outline" size={18} />
          <Text style={styles.shareBtnText}>Compartilhar</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Regenerar QR Code"
          accessibilityRole="button"
          disabled={isRegenerating}
          onPress={handleRegenerate}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.regenerateBtn,
            isRegenerating && styles.disabledBtn,
            pressed && !isRegenerating && styles.pressed,
          ]}
        >
          {isRegenerating ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <>
              <Ionicons color={colors.primaryDark} name="refresh-outline" size={18} />
              <Text style={styles.regenerateBtnText}>Regenerar QR</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  centeredPadded: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cardHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  avatar: {
    borderRadius: radii.md,
    height: 64,
    width: 64,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  petInfo: {
    flex: 1,
    minWidth: 0,
  },
  petName: {
    ...typography.h2,
    color: colors.text,
  },
  petBreed: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
  petMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  speciesPill: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  speciesText: {
    ...typography.caption,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  statValue: {
    ...typography.label,
    color: colors.text,
  },
  qrSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  qrContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  qrImage: {
    height: 200,
    width: 200,
  },
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.xl,
  },
  qrPlaceholderText: {
    ...typography.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  summaryGrid: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 36,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  summarySecondary: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  summaryUnavailableValue: {
    ...typography.label,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  summaryUnavailableHint: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  shareBtnText: {
    ...typography.button,
    color: colors.white,
  },
  regenerateBtn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  regenerateBtnText: {
    ...typography.button,
    color: colors.primaryDark,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.82,
  },
});
