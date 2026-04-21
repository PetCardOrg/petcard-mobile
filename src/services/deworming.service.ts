import type {
  CreateDewormingRecordDto,
  DewormingRecordResponseDto,
  UpdateDewormingRecordDto,
} from '@petcardorg/shared';

import { api } from './api';

const DEWORMINGS_ENDPOINT = '/dewormings';

export async function getDewormingsByPet(petId: string): Promise<DewormingRecordResponseDto[]> {
  const { data } = await api.get<DewormingRecordResponseDto[]>(DEWORMINGS_ENDPOINT, {
    params: { petId },
  });
  return data;
}

export async function getDewormingById(id: string): Promise<DewormingRecordResponseDto> {
  const { data } = await api.get<DewormingRecordResponseDto>(`${DEWORMINGS_ENDPOINT}/${id}`);
  return data;
}

export async function createDeworming(
  payload: CreateDewormingRecordDto,
): Promise<DewormingRecordResponseDto> {
  const { data } = await api.post<DewormingRecordResponseDto>(DEWORMINGS_ENDPOINT, payload);
  return data;
}

export async function updateDeworming(
  id: string,
  payload: UpdateDewormingRecordDto,
): Promise<DewormingRecordResponseDto> {
  const { data } = await api.patch<DewormingRecordResponseDto>(
    `${DEWORMINGS_ENDPOINT}/${id}`,
    payload,
  );
  return data;
}

export async function deleteDeworming(id: string): Promise<void> {
  await api.delete(`${DEWORMINGS_ENDPOINT}/${id}`);
}
