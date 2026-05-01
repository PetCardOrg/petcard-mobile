import type {
  CreateVaccineRecordDto,
  UpdateVaccineRecordDto,
  VaccineRecordResponseDto,
} from '@petcardorg/shared';

import { api } from './api';

const VACCINES_ENDPOINT = '/vaccines';
const getVaccinesByPetEndpoint = (petId: string) => `/pets/${petId}/vaccines`;

export async function getVaccinesByPet(petId: string): Promise<VaccineRecordResponseDto[]> {
  const { data } = await api.get<VaccineRecordResponseDto[]>(getVaccinesByPetEndpoint(petId));
  return data;
}

export async function getVaccineById(id: string): Promise<VaccineRecordResponseDto> {
  const { data } = await api.get<VaccineRecordResponseDto>(`${VACCINES_ENDPOINT}/${id}`);
  return data;
}

export async function createVaccine(
  payload: CreateVaccineRecordDto,
): Promise<VaccineRecordResponseDto> {
  const { data } = await api.post<VaccineRecordResponseDto>(
    getVaccinesByPetEndpoint(payload.pet_id),
    payload,
  );
  return data;
}

export async function updateVaccine(
  id: string,
  payload: UpdateVaccineRecordDto,
): Promise<VaccineRecordResponseDto> {
  const { data } = await api.patch<VaccineRecordResponseDto>(`${VACCINES_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deleteVaccine(id: string): Promise<void> {
  await api.delete(`${VACCINES_ENDPOINT}/${id}`);
}
