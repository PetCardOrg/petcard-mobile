import type {
  CreateMedicationRecordDto,
  MedicationRecordResponseDto,
  UpdateMedicationRecordDto,
} from '@petcardorg/shared';

import { api } from './api';

const MEDICATIONS_ENDPOINT = '/medications';
const getMedicationsByPetEndpoint = (petId: string) => `/pets/${petId}/medications`;

export async function getMedicationsByPet(petId: string): Promise<MedicationRecordResponseDto[]> {
  const { data } = await api.get<MedicationRecordResponseDto[]>(getMedicationsByPetEndpoint(petId));
  return data;
}

export async function getMedicationById(id: string): Promise<MedicationRecordResponseDto> {
  const { data } = await api.get<MedicationRecordResponseDto>(`${MEDICATIONS_ENDPOINT}/${id}`);
  return data;
}

export async function createMedication(
  payload: CreateMedicationRecordDto,
): Promise<MedicationRecordResponseDto> {
  const { data } = await api.post<MedicationRecordResponseDto>(
    getMedicationsByPetEndpoint(payload.pet_id),
    payload,
  );
  return data;
}

export async function updateMedication(
  id: string,
  payload: UpdateMedicationRecordDto,
): Promise<MedicationRecordResponseDto> {
  const { data } = await api.patch<MedicationRecordResponseDto>(
    `${MEDICATIONS_ENDPOINT}/${id}`,
    payload,
  );
  return data;
}

export async function deleteMedication(id: string): Promise<void> {
  await api.delete(`${MEDICATIONS_ENDPOINT}/${id}`);
}
