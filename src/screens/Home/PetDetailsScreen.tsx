import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { petService } from '../../services';
import type { HomeStackParamList } from '../../navigation/types';
import { calculateAge } from '../../utils/calculateAge';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PetDetailsScreenProps = NativeStackScreenProps<HomeStackParamList, 'PetDetails'>;

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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons color={colors.primary} name={icon} size={20} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PetDetailsScreen({ route }: PetDetailsScreenProps) {
  const [pet, setPet] = useState<PetResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          setIsLoading(true);
          setError(false);
          const data = await petService.getPetById(route.params.petId);
          if (!cancelled) setPet(data);
        } catch {
          if (!cancelled) setError(true);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [route.params.petId]),
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !pet) {
    return (
      <View style={styles.centered}>
        <Ionicons color={colors.muted} name="alert-circle-outline" size={48} />
        <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
      </View>
    );
  }

  const species = SPECIES_CONFIG[pet.species] ?? SPECIES_CONFIG[Species.OTHER];
  const sex = SEX_CONFIG[pet.sex];
  const age = calculateAge(pet.birth_date);
  const photoUrl = pet.photo_url && pet.photo_url.trim().length > 0 ? pet.photo_url : null;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: species.backgroundColor }]}>
            <MaterialCommunityIcons color={species.color} name={species.icon} size={48} />
          </View>
        )}
      </View>

      {/* Name + breed */}
      <Text style={styles.name}>{pet.name}</Text>
      {pet.breed ? <Text style={styles.breed}>{pet.breed}</Text> : null}

      {/* Species pill */}
      <View style={[styles.speciesPill, { backgroundColor: species.backgroundColor }]}>
        <MaterialCommunityIcons color={species.color} name={species.icon} size={16} />
        <Text style={[styles.speciesText, { color: species.color }]}>{species.label}</Text>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <InfoRow icon={sex.icon} label="Sexo" value={sex.label} />
        <View style={styles.separator} />
        <InfoRow icon="calendar-outline" label="Idade" value={age} />
        {pet.weight != null ? (
          <>
            <View style={styles.separator} />
            <InfoRow icon="fitness-outline" label="Peso" value={`${pet.weight} kg`} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  photo: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    borderRadius: 50,
    height: 100,
    justifyContent: 'center',
    width: 100,
  },
  name: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  breed: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  speciesPill: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  speciesText: {
    ...typography.label,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
});
