import { Alert, Text, View, StyleSheet } from 'react-native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing } from '../../utils/theme';

export function HomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    }
  };

  return (
    <ScreenContainer
      secondaryActionLabel="Sair"
      onSecondaryActionPress={handleLogout}
      subtitle="Área inicial do tutor. A lista real de pets entra na PC-039."
      title="Home"
    >
      {user?.name ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Olá, {user.name}</Text>
          <Text style={styles.panelText}>{user.email}</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  panelText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
