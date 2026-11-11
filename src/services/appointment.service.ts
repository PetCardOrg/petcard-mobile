import type {
  AppointmentResponseDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from '@petcardorg/shared';

import { api } from './api';
import { ensureList } from './ensureList';

const ENDPOINT = '/appointments';

export async function getAll(): Promise<AppointmentResponseDto[]> {
  const { data } = await api.get<AppointmentResponseDto[]>(ENDPOINT);
  return ensureList<AppointmentResponseDto>(data, 'agendamentos');
}

export async function getUpcoming(): Promise<AppointmentResponseDto[]> {
  const { data } = await api.get<AppointmentResponseDto[]>(ENDPOINT, {
    params: { upcoming: 'true' },
  });
  return ensureList<AppointmentResponseDto>(data, 'agendamentos');
}

export async function getById(id: string): Promise<AppointmentResponseDto> {
  const { data } = await api.get<AppointmentResponseDto>(`${ENDPOINT}/${id}`);
  return data;
}

export async function create(payload: CreateAppointmentDto): Promise<AppointmentResponseDto> {
  const { data } = await api.post<AppointmentResponseDto>(ENDPOINT, payload);
  return data;
}

export async function update(
  id: string,
  payload: UpdateAppointmentDto,
): Promise<AppointmentResponseDto> {
  const { data } = await api.patch<AppointmentResponseDto>(`${ENDPOINT}/${id}`, payload);
  return data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`${ENDPOINT}/${id}`);
}
