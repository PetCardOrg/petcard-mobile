import { Text, View, StyleSheet } from 'react-native';

import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { colors, radii, spacing } from '../../utils/theme';

type HomeScreenProps = {
  onSimulateLogout: () => void;
};

export function HomeScreen({ onSimulateLogout }: HomeScreenProps) {
  return (
    <ScreenContainer
      secondaryActionLabel="Voltar para Login"
      onSecondaryActionPress={onSimulateLogout}
      subtitle="Área inicial do tutor. A lista real de pets entra na PC-039."
      title="Home Screen"
    >
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Main Tabs ativo</Text>
        <Text style={styles.panelText}>
          Use as abas Home, Pets e Saúde para navegar pelos placeholders.
        </Text>
      </View>
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
