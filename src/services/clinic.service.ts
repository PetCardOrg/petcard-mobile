import type { ClinicaResponseDto } from '@petcardorg/shared';

import { api } from './api';

const CLINICS_ENDPOINT = '/clinicas';

type FindNearbyClinicsParams = {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
  offset?: number;
};

export async function findNearbyClinics(
  params: FindNearbyClinicsParams,
): Promise<ClinicaResponseDto[]> {
  const { data } = await api.get<ClinicaResponseDto[]>(CLINICS_ENDPOINT, { params });
  return data;
}
