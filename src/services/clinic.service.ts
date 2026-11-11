import type {
  AutocompleteQueryDto,
  FindNearbyPlacesQueryDto,
  PlaceSuggestionResponseDto,
  PlacesClinicResponseDto,
} from '@petcardorg/shared';

import { api } from './api';
import { ensureList } from './ensureList';

const CLINICS_ENDPOINT = '/clinicas';

export async function findNearbyPlaces(
  params: FindNearbyPlacesQueryDto,
): Promise<PlacesClinicResponseDto[]> {
  const { data } = await api.get<PlacesClinicResponseDto[]>(`${CLINICS_ENDPOINT}/places`, {
    params,
  });
  return ensureList<PlacesClinicResponseDto>(data, 'clínicas');
}

type AutocompleteParams = AutocompleteQueryDto & { signal?: AbortSignal };

export async function autocompletePlaces({
  signal,
  ...params
}: AutocompleteParams): Promise<PlaceSuggestionResponseDto[]> {
  const { data } = await api.get<PlaceSuggestionResponseDto[]>(`${CLINICS_ENDPOINT}/autocomplete`, {
    params,
    signal,
  });
  return ensureList<PlaceSuggestionResponseDto>(data, 'sugestões de local');
}
