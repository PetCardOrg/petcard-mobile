import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Sex,
  Species,
  type CarteiraDigitalResponseDto,
  type PetResponseDto,
} from '@petcardorg/shared';

import { colors } from './theme';

type PetLikeWithPhoto =
  | Pick<PetResponseDto, 'photo_url'>
  | Pick<CarteiraDigitalResponseDto, 'photo_url'>;

export function getPhotoUrl(pet: PetLikeWithPhoto): string | null {
  const url = pet.photo_url;
  if (typeof url !== 'string' || url.trim().length === 0) return null;
  if (!url.startsWith('https://')) return null;
  return url;
}

export type SpeciesConfig = {
  backgroundColor: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

export const SPECIES_CONFIG: Record<Species, SpeciesConfig> = {
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

export type SexConfig = { icon: keyof typeof Ionicons.glyphMap; label: string };

export const SEX_CONFIG: Record<Sex, SexConfig> = {
  [Sex.FEMALE]: { icon: 'female', label: 'Fêmea' },
  [Sex.MALE]: { icon: 'male', label: 'Macho' },
};
