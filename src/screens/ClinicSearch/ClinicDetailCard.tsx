import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlacesClinicResponseDto } from '@petcardorg/shared';

import { colors, radii, spacing, typography } from '../../utils/theme';

type ClinicDetailCardProps = {
  clinic: PlacesClinicResponseDto;
  onDismiss: () => void;
  bottomInset: number;
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function sanitizePhone(phone: string): string {
  return phone.replace(/[^+\d]/g, '');
}

async function handleCall(phone: string | undefined) {
  if (!phone) {
    Alert.alert('Telefone indisponível', 'Esta clínica não possui telefone cadastrado.');
    return;
  }

  const url = `tel:${sanitizePhone(phone)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Não foi possível ligar', 'Seu dispositivo não suporta chamadas telefônicas.');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Erro', 'Não foi possível abrir o discador.');
  }
}

async function handleOpenMaps(url: string | undefined) {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
  }
}

function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<Ionicons key={`full-${i}`} name="star" size={14} color="#F59E0B" />);
  }
  if (hasHalf) {
    stars.push(<Ionicons key="half" name="star-half" size={14} color="#F59E0B" />);
  }
  const remaining = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < remaining; i++) {
    stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />);
  }

  return <View style={styles.starsRow}>{stars}</View>;
}

export function ClinicDetailCard({ clinic, onDismiss, bottomInset }: ClinicDetailCardProps) {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, spacing.md) }]}>
      <View style={styles.card}>
        {clinic.photoUrl ? <Image source={{ uri: clinic.photoUrl }} style={styles.photo} /> : null}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="medkit" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={1}>
                  {clinic.name}
                </Text>
                <View style={styles.metaRow}>
                  {clinic.rating != null ? (
                    <View style={styles.ratingContainer}>
                      <RatingStars rating={clinic.rating} />
                      <Text style={styles.ratingText}>
                        {clinic.rating.toFixed(1)}
                        {clinic.userRatingCount ? ` (${clinic.userRatingCount})` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {clinic.openNow != null ? (
                    <View
                      style={[
                        styles.statusBadge,
                        clinic.openNow ? styles.statusOpen : styles.statusClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          clinic.openNow ? styles.statusTextOpen : styles.statusTextClosed,
                        ]}
                      >
                        {clinic.openNow ? 'Aberto' : 'Fechado'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={colors.muted} />
              <Text style={styles.detailText} numberOfLines={2}>
                {clinic.address}
              </Text>
            </View>

            {clinic.phone ? (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color={colors.muted} />
                <Text style={styles.detailText}>{clinic.phone}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={[styles.detailText, styles.distanceText]}>
                {formatDistance(clinic.distanceMeters)}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => handleCall(clinic.phone)}
              style={({ pressed }) => [
                styles.actionButton,
                styles.callButton,
                !clinic.phone && styles.actionButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="call" size={18} color={clinic.phone ? colors.white : colors.muted} />
              <Text
                style={[styles.actionButtonText, !clinic.phone && styles.actionButtonTextDisabled]}
              >
                Ligar
              </Text>
            </Pressable>

            {clinic.googleMapsUrl ? (
              <Pressable
                onPress={() => handleOpenMaps(clinic.googleMapsUrl)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.mapsButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="map-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, styles.mapsButtonText]}>Rotas</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    elevation: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  photo: {
    height: 120,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  ratingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    ...typography.caption,
    color: colors.muted,
  },
  statusBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#065F46',
  },
  statusTextClosed: {
    color: '#991B1B',
  },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  distanceText: {
    color: colors.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radii.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  callButton: {
    backgroundColor: colors.success,
  },
  mapsButton: {
    backgroundColor: colors.primarySoft,
  },
  actionButtonDisabled: {
    backgroundColor: colors.border,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.white,
  },
  actionButtonTextDisabled: {
    color: colors.muted,
  },
  mapsButtonText: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.82,
  },
});
