import type { PetScanResponseDto, TagColeiraResponseDto } from '@petcardorg/shared';

import { api } from './api';
import { ensureList } from './ensureList';

export async function getTag(petId: string): Promise<TagColeiraResponseDto> {
  const { data } = await api.get<TagColeiraResponseDto>(`/coleira/pets/${petId}/tag`);
  return data;
}

export async function getByPet(petId: string): Promise<PetScanResponseDto[]> {
  const { data } = await api.get<PetScanResponseDto[]>(`/coleira/pets/${petId}/scans`);
  return ensureList<PetScanResponseDto>(data, 'leituras da coleira');
}
