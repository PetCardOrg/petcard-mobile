import type { ClinicaResponseDto, PlacesClinicResponseDto } from '@petcardorg/shared';

import { api } from './api';

const CLINICS_ENDPOINT = '/clinicas';

type FindNearbyClinicsParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  specialty?: string;
  limit?: number;
  offset?: number;
};

type FindNearbyPlacesParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  openNow?: boolean;
  maxResults?: number;
};

export async function findNearbyClinics(
  params: FindNearbyClinicsParams,
): Promise<ClinicaResponseDto[]> {
  const { data } = await api.get<ClinicaResponseDto[]>(CLINICS_ENDPOINT, { params });
  return data;
}

export async function findNearbyPlaces(
  params: FindNearbyPlacesParams,
): Promise<PlacesClinicResponseDto[]> {
  const { data } = await api.get<PlacesClinicResponseDto[]>(`${CLINICS_ENDPOINT}/places`, {
    params,
  });
  return data;
}
