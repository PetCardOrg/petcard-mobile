import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Species, type PetResponseDto } from '@petcardorg/shared';

import { EmptyState } from '../ui/EmptyState';
import { getPhotoUrl, SPECIES_CONFIG } from '../../utils/petConfig';
import { colors, radii, spacing, typography } from '../../utils/theme';

/**
 * Mesma identidade visual do card da Home: foto quando existe, avatar da
 * espécie quando não. Reconhecer o pet pela foto é o que torna a escolha
 * imediata para quem tem mais de um.
 */
function PetAvatar({ pet }: { pet: PetResponseDto }) {
  const photoUrl = getPhotoUrl(pet);
  const species = SPECIES_CONFIG[pet.species] ?? SPECIES_CONFIG[Species.OTHER];

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.petItemPhoto} />;
  }

  return (
    <View style={[styles.petItemIcon, { backgroundColor: species.backgroundColor }]}>
      <MaterialCommunityIcons color={species.color} name={species.icon} size={24} />
    </View>
  );
}

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
            <PetAvatar pet={item} />
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
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  petItemPhoto: {
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 44,
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
