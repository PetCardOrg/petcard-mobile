import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../../utils/theme';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = 'Ops, algo deu errado', message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons color={colors.danger} name="alert-circle-outline" size={40} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons color={colors.white} name="refresh" size={18} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
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
  message: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
