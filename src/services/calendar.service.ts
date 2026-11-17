import type { CalendarConnectResponseDto, CalendarStatusResponseDto } from '@petcardorg/shared';

import { api } from './api';

const ENDPOINT = '/calendar';

/** Como o consentimento terminou, lido do `?calendar=` da volta ao app. */
export type CalendarConnectOutcome = 'connected' | 'denied' | 'error';

/**
 * `returnUrl` é o endereço do app para onde a API devolve o tutor depois do
 * consentimento — é o que fecha a aba do navegador sozinha.
 */
export async function getConnectUrl(returnUrl?: string): Promise<string | null> {
  const { data } = await api.get<CalendarConnectResponseDto>(`${ENDPOINT}/connect`, {
    params: returnUrl ? { return_url: returnUrl } : undefined,
  });
  return data.auth_url ?? null;
}

export function parseConnectOutcome(url: string): CalendarConnectOutcome | null {
  const match = /[?&]calendar=([^&#]+)/.exec(url);
  const value = match?.[1];
  return value === 'connected' || value === 'denied' || value === 'error' ? value : null;
}

export async function getStatus(): Promise<boolean> {
  const { data } = await api.get<CalendarStatusResponseDto>(`${ENDPOINT}/status`);
  return data.connected;
}

export async function disconnect(): Promise<void> {
  await api.delete(`${ENDPOINT}/disconnect`);
}
