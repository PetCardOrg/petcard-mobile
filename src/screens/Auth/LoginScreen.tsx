import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing } from '../../utils/theme';

export function LoginScreen() {
  const { isLoading, error, login } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      await login();
    } catch {
      Alert.alert(t('login.errorTitle'), t('login.errorMessage'));
    }
  };

  return (
    <ScreenContainer
      actionLabel={isLoading ? undefined : t('login.button')}
      onActionPress={handleLogin}
      subtitle={t('login.subtitle')}
      title={t('login.title')}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : null}

      {error ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{t('login.authErrorTitle')}</Text>
          <Text style={styles.calloutText}>{error.message}</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.lg,
  },
  callout: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    borderWidth: 1,
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
