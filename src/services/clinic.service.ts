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
