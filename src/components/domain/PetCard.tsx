import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import { calculateAge } from '../../utils/calculateAge';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PetCardProps = {
  pet: PetResponseDto;
  onPress: (pet: PetResponseDto) => void;
};

const SPECIES_CONFIG: Record<
  Species,
  {
    backgroundColor: string;
    color: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
  }
> = {
  [Species.DOG]: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    icon: 'dog',
    label: 'Cachorro',
  },
  [Species.CAT]: {
    backgroundColor: '#F0EBFF',
    color: '#6B48C8',
    icon: 'cat',
    label: 'Gato',
  },
  [Species.BIRD]: {
    backgroundColor: colors.successSoft,
    color: '#16866B',
    icon: 'bird',
    label: 'Ave',
  },
  [Species.OTHER]: {
    backgroundColor: colors.warningSoft,
    color: '#8A650F',
    icon: 'paw',
    label: 'Outro',
  },
};

const SEX_CONFIG: Record<Sex, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  [Sex.FEMALE]: { icon: 'female', label: 'Fêmea' },
  [Sex.MALE]: { icon: 'male', label: 'Macho' },
};

function getPhotoUrl(pet: PetResponseDto): string | null {
  const url = pet.photo_url;
  return typeof url === 'string' && url.trim().length > 0 ? url : null;
}

export function PetCard({ pet, onPress }: PetCardProps) {
  const species = SPECIES_CONFIG[pet.species] ?? SPECIES_CONFIG[Species.OTHER];
  const sex = SEX_CONFIG[pet.sex];
  const photoUrl = getPhotoUrl(pet);
  const age = calculateAge(pet.birth_date);

  return (
    <Pressable
      accessibilityLabel={`Abrir detalhes de ${pet.name}`}
      accessibilityRole="button"
      onPress={() => onPress(pet)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: species.backgroundColor }]}>
          <MaterialCommunityIcons color={species.color} name={species.icon} size={28} />
        </View>
      )}

      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {pet.name}
        </Text>
        {pet.breed ? (
          <Text numberOfLines={1} style={styles.breed}>
            {pet.breed}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={[styles.pill, { backgroundColor: species.backgroundColor }]}>
            <MaterialCommunityIcons color={species.color} name={species.icon} size={14} />
            <Text style={[styles.pillText, { color: species.color }]}>{species.label}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons color={colors.muted} name={sex.icon} size={14} />
            <Text style={styles.metaText}>{sex.label}</Text>
          </View>
          <Text style={styles.metaText}>{age}</Text>
        </View>
      </View>

      <Ionicons color={colors.muted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.text,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  photo: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 58,
    width: 58,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    flexShrink: 1,
  },
  breed: {
    ...typography.bodySmall,
    color: colors.muted,
    flexShrink: 1,
    marginTop: 2,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    alignItems: 'center',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pillText: {
    ...typography.caption,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.82,
  },
});
