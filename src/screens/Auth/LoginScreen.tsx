import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { PasswordInput } from '../../components/PasswordInput';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../utils/theme';
import type { AuthStackParamList } from '../../navigation/types';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { isLoading, login } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<LoginNav>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('login.fillFields'));
      return;
    }

    try {
      setError(null);
      await login(email.trim(), password);
    } catch {
      setError(t('login.errorMessage'));
    }
  };

  return (
    <ScreenContainer
      actionLabel={isLoading ? undefined : t('login.button')}
      onActionPress={handleLogin}
      secondaryActionLabel={t('login.registerLink')}
      onSecondaryActionPress={() => navigation.navigate('Register')}
      subtitle={t('login.subtitle')}
      title={t('login.title')}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>{t('login.emailLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder={t('login.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>{t('login.passwordLabel')}</Text>
          <PasswordInput
            onChangeText={setPassword}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
          />

          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotLinkText}>{t('login.forgotPasswordLink')}</Text>
          </Pressable>

          <GoogleSignInButton label={t('login.googleButton')} onError={setError} />

          {error ? (
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{t('login.authErrorTitle')}</Text>
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotLinkText: {
    ...typography.label,
    color: colors.primaryDark,
  },
  callout: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  calloutTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  calloutText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
