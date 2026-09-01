import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../utils/theme';
import type { AuthStackParamList } from '../../navigation/types';

type ForgotNav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<ForgotNav>();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t('forgotPassword.fillEmail'));
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError(t('forgotPassword.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      actionLabel={sent || submitting ? undefined : t('forgotPassword.button')}
      onActionPress={handleSubmit}
      secondaryActionLabel={t('forgotPassword.backToLogin')}
      onSecondaryActionPress={() => navigation.navigate('Login')}
      subtitle={t('forgotPassword.subtitle')}
      title={t('forgotPassword.title')}
    >
      {submitting ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : sent ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{t('forgotPassword.sentMessage')}</Text>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>{t('forgotPassword.emailLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder={t('forgotPassword.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
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
  notice: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
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
