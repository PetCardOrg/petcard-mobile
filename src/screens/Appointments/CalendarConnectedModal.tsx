import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Perk = {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  textKey: string;
};

const PERKS: Perk[] = [
  {
    icon: 'calendar-outline',
    titleKey: 'appointments.calendar.success.appointmentsTitle',
    textKey: 'appointments.calendar.success.appointmentsText',
  },
  {
    icon: 'notifications-outline',
    titleKey: 'appointments.calendar.success.remindersTitle',
    textKey: 'appointments.calendar.success.remindersText',
  },
  {
    icon: 'sync-outline',
    titleKey: 'appointments.calendar.success.syncTitle',
    textKey: 'appointments.calendar.success.syncText',
  },
];

/**
 * Confirmação de que o Google Agenda foi conectado. Aparece quando o callback
 * do OAuth devolve o tutor ao app (`?calendar=connected`) — substitui a página
 * "pode fechar esta janela" do navegador, que deixava o tutor sem saber o que
 * mudou.
 */
export function CalendarConnectedModal({ visible, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Ionicons color={colors.success} name="checkmark-circle" size={48} />
          </View>
          <Text style={styles.title}>{t('appointments.calendar.success.title')}</Text>
          <Text style={styles.subtitle}>{t('appointments.calendar.success.subtitle')}</Text>

          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk.icon} style={styles.perk}>
                <View style={styles.perkIcon}>
                  <Ionicons color={colors.primaryDark} name={perk.icon} size={18} />
                </View>
                <View style={styles.perkTexts}>
                  <Text style={styles.perkTitle}>{t(perk.titleKey)}</Text>
                  <Text style={styles.perkText}>{t(perk.textKey)}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{t('appointments.calendar.success.done')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 49, 63, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  perks: {
    marginTop: spacing.md,
  },
  perk: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  perkIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  perkTexts: {
    flex: 1,
  },
  perkTitle: {
    ...typography.label,
    color: colors.text,
  },
  perkText: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingVertical: 14,
  },
  buttonPressed: {
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
});
