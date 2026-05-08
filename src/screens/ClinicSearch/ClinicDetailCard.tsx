import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ClinicaResponseDto } from '@petcardorg/shared';

import { colors, radii, spacing, typography } from '../../utils/theme';

type ClinicDetailCardProps = {
  clinic: ClinicaResponseDto;
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

export function ClinicDetailCard({ clinic, onDismiss, bottomInset }: ClinicDetailCardProps) {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(bottomInset, spacing.md) }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="medkit" size={20} color={colors.primaryDark} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1}>
                {clinic.name}
              </Text>
              {clinic.specialty ? (
                <Text style={styles.specialty} numberOfLines={1}>
                  {clinic.specialty}
                </Text>
              ) : null}
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
              {formatDistance(clinic.distance_meters)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleCall(clinic.phone)}
          style={({ pressed }) => [
            styles.callButton,
            !clinic.phone && styles.callButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="call" size={18} color={clinic.phone ? colors.white : colors.muted} />
          <Text style={[styles.callButtonText, !clinic.phone && styles.callButtonTextDisabled]}>
            {clinic.phone ? 'Ligar para a clínica' : 'Telefone indisponível'}
          </Text>
        </Pressable>
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
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
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
  specialty: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 2,
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
  callButton: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: 12,
  },
  callButtonDisabled: {
    backgroundColor: colors.border,
  },
  callButtonText: {
    ...typography.button,
    color: colors.white,
  },
  callButtonTextDisabled: {
    color: colors.muted,
  },
  pressed: {
    opacity: 0.82,
  },
});
