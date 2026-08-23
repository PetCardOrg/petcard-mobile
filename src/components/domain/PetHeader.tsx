import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../utils/theme';

type PetHeaderProps = {
  petName: string;
  onBack: () => void;
};

export function PetHeader({ petName, onBack }: PetHeaderProps) {
  return (
    // O "Trocar" era um rótulo a mais dentro do mesmo Pressable da seta: os
    // dois disparavam a mesma ação. A seta já diz o que faz, e sem o texto o
    // nome do pet ganha a linha inteira.
    <Pressable
      accessibilityLabel={`Trocar de pet (atual: ${petName})`}
      accessibilityRole="button"
      onPress={onBack}
      style={styles.petHeader}
    >
      <Ionicons color={colors.primaryDark} name="arrow-back" size={20} />
      <Text style={styles.petHeaderName}>{petName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  petHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  petHeaderName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
});
