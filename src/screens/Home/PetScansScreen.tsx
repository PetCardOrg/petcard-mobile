import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import type { HomeStackParamList } from '../../navigation/types';
import { scanService } from '../../services';
import type { PetScan } from '../../services/scan.service';
import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'PetScans'>;

/**
 * `created_at` é instante ISO (não dia de calendário), então `Date` é seguro
 * aqui — a ressalva de fuso do histórico clínico não se aplica.
 */
function formatarInstante(iso: string): string {
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return iso;
  const data = instante.toLocaleDateString('pt-BR');
  const hora = instante.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${data} · ${hora}`;
}

export function temLocalizacao(
  scan: PetScan,
): scan is PetScan & { latitude: number; longitude: number } {
  return scan.latitude !== undefined && scan.longitude !== undefined;
}

/**
 * Abre o ponto no app de mapas do aparelho.
 *
 * `geo:` com `q=` repetindo a coordenada, e não só `geo:lat,lng`: sem o `q` o
 * Android centraliza o mapa no ponto mas não crava o marcador, e o tutor perde
 * de vista exatamente o que veio ver.
 */
function urlDoMapa(latitude: number, longitude: number): string {
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
}

function ScanItem({ scan }: { scan: PetScan }) {
  const { t } = useTranslation();
  const localizado = temLocalizacao(scan);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, !localizado && styles.cardIconMuted]}>
          <Ionicons
            color={localizado ? colors.primary : colors.muted}
            name={localizado ? 'location' : 'help-circle-outline'}
            size={18}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{t('petScans.item.title')}</Text>
          <Text style={styles.cardDate}>{formatarInstante(scan.created_at)}</Text>
        </View>
      </View>

      {localizado ? (
        <>
          {scan.accuracy_meters !== undefined ? (
            <Text style={styles.cardAccuracy}>
              {t('petScans.item.accuracy', {
                meters: Math.round(scan.accuracy_meters),
              })}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(urlDoMapa(scan.latitude, scan.longitude))}
            style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
            testID={`open-map-${scan.id}`}
          >
            <Ionicons color={colors.white} name="map-outline" size={16} />
            <Text style={styles.mapButtonText}>{t('petScans.item.openMap')}</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.cardNoLocation}>{t('petScans.item.noLocation')}</Text>
      )}
    </View>
  );
}

/**
 * Onde e quando o QR da coleira foi lido por quem encontrou o pet.
 *
 * Existe porque o push é frágil: o tutor pode estar sem device token, ter
 * negado a permissão de notificação ou simplesmente ter dispensado o aviso.
 * Esta tela é a cópia durável da mesma informação.
 */
export function PetScansScreen({ route }: Props) {
  const { t } = useTranslation();
  const { petId } = route.params;

  const [scans, setScans] = useState<PetScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const carregar = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'refresh') setIsRefreshing(true);
      else setIsLoading(true);

      try {
        setError(false);
        setScans(await scanService.getByPet(petId));
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [petId],
  );

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t('petScans.error')} onRetry={() => void carregar()} />
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="location-outline"
          title={t('petScans.emptyTitle')}
          description={t('petScans.emptyDescription')}
        />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={scans}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ScanItem scan={item} />}
      refreshControl={
        <RefreshControl
          onRefresh={() => void carregar('refresh')}
          refreshing={isRefreshing}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    gap: spacing.sm,
    padding: spacing.lg,
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
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  cardIconMuted: {
    backgroundColor: colors.background,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
  },
  cardDate: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
  cardAccuracy: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  cardNoLocation: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  mapButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapButtonText: {
    ...typography.caption,
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
