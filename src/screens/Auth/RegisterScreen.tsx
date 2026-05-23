import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../utils/theme';
import type { AuthStackParamList } from '../../navigation/types';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { isLoading, register } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterNav>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(t('register.fillFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    try {
      setError(null);
      await register(name.trim(), email.trim(), password);
    } catch {
      setError(t('register.errorMessage'));
    }
  };

  return (
    <ScreenContainer
      actionLabel={isLoading ? undefined : t('register.button')}
      onActionPress={handleRegister}
      secondaryActionLabel={t('register.loginLink')}
      onSecondaryActionPress={() => navigation.goBack()}
      subtitle={t('register.subtitle')}
      title={t('register.title')}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>{t('register.nameLabel')}</Text>
          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            onChangeText={setName}
            placeholder={t('register.namePlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>{t('register.emailLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder={t('register.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>{t('register.passwordLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder={t('register.passwordPlaceholder')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? (
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{t('register.errorTitle')}</Text>
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
