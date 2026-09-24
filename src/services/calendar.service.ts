import { api } from './api';

const ENDPOINT = '/calendar';

type ConnectResponse = {
  auth_url?: string;
  connected?: boolean;
  message?: string;
};

type StatusResponse = {
  connected: boolean;
};

export async function getConnectUrl(): Promise<string | null> {
  const { data } = await api.get<ConnectResponse>(`${ENDPOINT}/connect`);
  return data.auth_url ?? null;
}

export async function getStatus(): Promise<boolean> {
  const { data } = await api.get<StatusResponse>(`${ENDPOINT}/status`);
  return data.connected;
}

export async function disconnect(): Promise<void> {
  await api.delete(`${ENDPOINT}/disconnect`);
}
