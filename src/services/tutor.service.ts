import type { CreateTutorDto, TutorResponseDto, UpdateTutorDto } from '@petcardorg/shared';

import { api } from './api';

const TUTORS_ENDPOINT = '/tutors';

export async function getCurrentTutor(): Promise<TutorResponseDto> {
  const { data } = await api.get<TutorResponseDto>(`${TUTORS_ENDPOINT}/me`);
  return data;
}

export async function getTutorById(id: string): Promise<TutorResponseDto> {
  const { data } = await api.get<TutorResponseDto>(`${TUTORS_ENDPOINT}/${id}`);
  return data;
}

export async function createTutor(payload: CreateTutorDto): Promise<TutorResponseDto> {
  const { data } = await api.post<TutorResponseDto>(TUTORS_ENDPOINT, payload);
  return data;
}

export async function updateTutor(id: string, payload: UpdateTutorDto): Promise<TutorResponseDto> {
  const { data } = await api.patch<TutorResponseDto>(`${TUTORS_ENDPOINT}/${id}`, payload);
  return data;
}

export async function deleteTutor(id: string): Promise<void> {
  await api.delete(`${TUTORS_ENDPOINT}/${id}`);
}
