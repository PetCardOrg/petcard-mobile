import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { PasswordInput } from '../../components/PasswordInput';
import { PasswordRulesChecklist } from '../../components/PasswordRulesChecklist';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { validatePasswordStrength } from '../../utils/passwordStrength';
import { colors, radii, spacing, typography } from '../../utils/theme';
import type { AuthStackParamList } from '../../navigation/types';

type ResetNav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type ResetRoute = RouteProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<ResetNav>();
  const route = useRoute<ResetRoute>();

  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token.trim()) {
      setError(t('resetPassword.fillToken'));
      return;
    }

    const rule = validatePasswordStrength(password);
    if (rule) {
      setError(t(`passwordRules.${rule}`));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      await resetPassword(token.trim(), password);
      Alert.alert(t('resetPassword.successTitle'), t('resetPassword.successMessage'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch {
      setError(t('resetPassword.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      actionLabel={submitting ? undefined : t('resetPassword.button')}
      onActionPress={handleSubmit}
      secondaryActionLabel={t('resetPassword.backToLogin')}
      onSecondaryActionPress={() => navigation.navigate('Login')}
      subtitle={t('resetPassword.subtitle')}
      title={t('resetPassword.title')}
    >
      {submitting ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View style={styles.form}>
          {route.params?.token ? null : (
            <>
              <Text style={styles.label}>{t('resetPassword.tokenLabel')}</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setToken}
                placeholder={t('resetPassword.tokenPlaceholder')}
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={token}
              />
            </>
          )}

          <Text style={styles.label}>{t('resetPassword.passwordLabel')}</Text>
          <PasswordInput
            onChangeText={setPassword}
            placeholder={t('resetPassword.passwordPlaceholder')}
            value={password}
          />

          <PasswordRulesChecklist password={password} />

          <Text style={styles.label}>{t('resetPassword.confirmLabel')}</Text>
          <PasswordInput
            onChangeText={setConfirmPassword}
            placeholder={t('resetPassword.confirmPlaceholder')}
            value={confirmPassword}
          />

          {error ? (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>{error}</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.lg,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  callout: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  calloutText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
