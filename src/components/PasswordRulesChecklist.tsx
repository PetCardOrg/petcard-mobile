import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { PASSWORD_RULES, checkPasswordRules } from '../utils/passwordStrength';
import { colors, spacing, typography } from '../utils/theme';

type Props = {
  password: string;
};

/**
 * Listinha ao vivo das regras de senha forte (mobile#54). Cada regra começa
 * cinza e fica verde assim que a senha digitada a cumpre.
 */
export function PasswordRulesChecklist({ password }: Props) {
  const { t } = useTranslation();
  const status = checkPasswordRules(password);

  return (
    <View accessibilityRole="list" style={styles.container}>
      {PASSWORD_RULES.map((rule) => {
        const met = status[rule.id];
        return (
          <View key={rule.id} style={styles.row}>
            <Ionicons
              color={met ? colors.success : colors.muted}
              name={met ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
            />
            <Text style={[styles.label, met ? styles.labelMet : null]}>
              {t(`passwordRules.checklist.${rule.id}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  labelMet: {
    color: colors.success,
  },
});
