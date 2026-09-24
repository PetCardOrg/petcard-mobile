import type { PlacesClinicResponseDto } from '@petcardorg/shared';

import { api } from './api';

const CLINICS_ENDPOINT = '/clinicas';

type FindNearbyPlacesParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  openNow?: boolean;
  maxResults?: number;
};

export async function findNearbyPlaces(
  params: FindNearbyPlacesParams,
): Promise<PlacesClinicResponseDto[]> {
  const { data } = await api.get<PlacesClinicResponseDto[]>(`${CLINICS_ENDPOINT}/places`, {
    params,
  });
  return data;
}

/**
 * Uma sugestão do autocomplete de local.
 *
 * Tipo local, e não do `@petcardorg/shared`, porque nada disso é persistido: o
 * agendamento guarda apenas `fullText` no campo `location`.
 */
export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText?: string;
  fullText: string;
};

type AutocompleteParams = {
  input: string;
  lat?: number;
  lng?: number;
  /** Agrupa as teclas de uma mesma edição numa sessão de cobrança do Places. */
  sessionToken?: string;
  signal?: AbortSignal;
};

export async function autocompletePlaces({
  signal,
  ...params
}: AutocompleteParams): Promise<PlaceSuggestion[]> {
  const { data } = await api.get<PlaceSuggestion[]>(`${CLINICS_ENDPOINT}/autocomplete`, {
    params,
    signal,
  });
  return data;
}
