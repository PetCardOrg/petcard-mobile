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

/**
 * Atualiza o próprio cadastro.
 *
 * A rota é `/tutors/me`, não `/tutors/:id` — a api nunca teve atualização por
 * id, e passar um continuaria caindo em `GET /tutors/:id`, que é do
 * veterinário. O dono é quem está no token.
 */
export async function updateCurrentTutor(payload: UpdateTutorDto): Promise<TutorResponseDto> {
  const { data } = await api.patch<TutorResponseDto>(`${TUTORS_ENDPOINT}/me`, payload);
  return data;
}

/** Exclusão definitiva da conta. Leva pets e prontuário junto. */
export async function deleteCurrentTutor(): Promise<void> {
  await api.delete(`${TUTORS_ENDPOINT}/me`);
}
