import type { CreatePetDto, PetResponseDto, UpdatePetDto } from '@petcardorg/shared';

import { api } from './api';

const PETS_ENDPOINT = '/pets';

export async function getMyPets(): Promise<PetResponseDto[]> {
  const { data } = await api.get<PetResponseDto[]>(PETS_ENDPOINT);
  return data;
}

export async function getPetById(id: string): Promise<PetResponseDto> {
  const { data } = await api.get<PetResponseDto>(`${PETS_ENDPOINT}/${id}`);
  return data;
}

export async function createPet(payload: CreatePetDto): Promise<PetResponseDto> {
  const { data } = await api.post<PetResponseDto>(PETS_ENDPOINT, payload);
  return data;
}

export async function updatePet(id: string, payload: UpdatePetDto): Promise<PetResponseDto> {
  const { data } = await api.patch<PetResponseDto>(`${PETS_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deletePet(id: string): Promise<void> {
  await api.delete(`${PETS_ENDPOINT}/${id}`);
}
