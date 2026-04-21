import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing } from '../../utils/theme';

export function LoginScreen() {
  const { isLoading, error, login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch {
      Alert.alert('Erro no login', 'Não foi possível realizar o login. Tente novamente.');
    }
  };

  return (
    <ScreenContainer
      actionLabel={isLoading ? undefined : 'Entrar'}
      onActionPress={handleLogin}
      subtitle="Carteira digital de saúde para acompanhar vacinas, vermifugações e medicações dos seus pets."
      title="PetCard"
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : null}

      {error ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Erro de autenticação</Text>
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
