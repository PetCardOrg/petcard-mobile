import { Text, View, StyleSheet } from 'react-native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radii, spacing } from '../../utils/theme';

type LoginScreenProps = {
  onSimulateLogin: () => void;
};

export function LoginScreen({ onSimulateLogin }: LoginScreenProps) {
  return (
    <ScreenContainer
      actionLabel="Simular login"
      onActionPress={onSimulateLogin}
      subtitle="Carteira digital de saúde para acompanhar vacinas, vermifugações e medicações dos seus pets."
      title="Login Screen"
    >
      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>Auth Stack ativo</Text>
        <Text style={styles.calloutText}>
          Esta tela será substituída pelo fluxo Auth0 na PC-038.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  calloutTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  calloutText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
