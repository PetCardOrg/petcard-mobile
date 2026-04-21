import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PetResponseDto } from '@petcardorg/shared';

import { EmptyState } from '../ui/EmptyState';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PetSelectorProps = {
  pets: PetResponseDto[];
  isLoading: boolean;
  onSelectPet: (pet: PetResponseDto) => void;
  subtitle: string;
  emptyDescription: string;
};

export function PetSelector({
  pets,
  isLoading,
  onSelectPet,
  subtitle,
  emptyDescription,
}: PetSelectorProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="paw-outline"
          title="Nenhum pet cadastrado"
          description={emptyDescription}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoMark}>
        <Ionicons color={colors.white} name="paw" size={20} />
      </View>
      <Text style={styles.sectionTitle}>Selecione o pet</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.petListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectPet(item)}
            style={({ pressed }) => [styles.petItem, pressed && styles.pressed]}
          >
            <View style={styles.petItemIcon}>
              <Ionicons color={colors.primary} name="paw" size={24} />
            </View>
            <View style={styles.petItemInfo}>
              <Text style={styles.petItemName}>{item.name}</Text>
              {item.breed ? <Text style={styles.petItemBreed}>{item.breed}</Text> : null}
            </View>
            <Ionicons color={colors.muted} name="chevron-forward" size={20} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 40,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  petListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  petItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  petItemIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  petItemInfo: {
    flex: 1,
  },
  petItemName: {
    ...typography.h3,
    color: colors.text,
  },
  petItemBreed: {
    ...typography.bodySmall,
    color: colors.muted,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.82,
  },
});
