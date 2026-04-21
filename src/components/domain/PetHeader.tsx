import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography } from '../../utils/theme';

type PetHeaderProps = {
  petName: string;
  onBack: () => void;
};

export function PetHeader({ petName, onBack }: PetHeaderProps) {
  return (
    <Pressable onPress={onBack} style={styles.petHeader}>
      <Ionicons color={colors.primaryDark} name="arrow-back" size={20} />
      <Text style={styles.petHeaderName}>{petName}</Text>
      <Text style={styles.petHeaderChange}>Trocar</Text>
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
  petHeaderChange: {
    ...typography.label,
    color: colors.primary,
  },
});
