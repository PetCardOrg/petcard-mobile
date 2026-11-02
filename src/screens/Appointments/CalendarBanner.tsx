import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = {
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function CalendarBanner({ connected, onConnect, onDisconnect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.calendarBanner}>
      <View style={styles.calendarBannerLeft}>
        <Ionicons
          name={connected ? 'checkmark-circle' : 'logo-google'}
          size={20}
          color={connected ? colors.success : colors.primaryDark}
        />
        {/* Único lugar que fala de sincronização: a regra é dita uma vez
            aqui, em vez de repetida em cada card. */}
        <View style={styles.calendarBannerTexts}>
          <Text style={styles.calendarBannerText}>
            {connected
              ? t('appointments.calendar.connected')
              : t('appointments.calendar.notConnected')}
          </Text>
          <Text style={styles.calendarBannerHint}>
            {connected
              ? t('appointments.calendar.connectedHint')
              : t('appointments.calendar.notConnectedHint')}
          </Text>
        </View>
      </View>
      <View style={styles.calendarBannerActions}>
        {connected ? (
          <Pressable onPress={onDisconnect} hitSlop={8}>
            <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onConnect}
            style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}
          >
            <Text style={styles.connectButtonText}>{t('appointments.calendar.connect')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  calendarBannerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  calendarBannerTexts: {
    flex: 1,
    gap: 2,
  },
  calendarBannerText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  calendarBannerHint: {
    color: colors.muted,
    fontSize: 12,
  },
  calendarBannerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  connectButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  connectButtonText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.82,
  },
});
