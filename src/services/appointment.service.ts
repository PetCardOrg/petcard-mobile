import { api } from './api';

const ENDPOINT = '/appointments';

export type AppointmentResponse = {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  pet_id?: string;
  pet_name?: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
};

export type CreateAppointmentPayload = {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes?: number;
  location?: string;
  pet_id?: string;
};

export type UpdateAppointmentPayload = Partial<CreateAppointmentPayload>;

export async function getAll(): Promise<AppointmentResponse[]> {
  const { data } = await api.get<AppointmentResponse[]>(ENDPOINT);
  return data;
}

export async function getUpcoming(): Promise<AppointmentResponse[]> {
  const { data } = await api.get<AppointmentResponse[]>(ENDPOINT, {
    params: { upcoming: 'true' },
  });
  return data;
}

export async function getById(id: string): Promise<AppointmentResponse> {
  const { data } = await api.get<AppointmentResponse>(`${ENDPOINT}/${id}`);
  return data;
}

export async function create(payload: CreateAppointmentPayload): Promise<AppointmentResponse> {
  const { data } = await api.post<AppointmentResponse>(ENDPOINT, payload);
  return data;
}

export async function update(
  id: string,
  payload: UpdateAppointmentPayload,
): Promise<AppointmentResponse> {
  const { data } = await api.patch<AppointmentResponse>(`${ENDPOINT}/${id}`, payload);
  return data;
}

export async function remove(id: string): Promise<void> {
  await api.delete(`${ENDPOINT}/${id}`);
}
