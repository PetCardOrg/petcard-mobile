import type { DeviceTokenResponseDto, RegisterDeviceDto } from '@petcardorg/shared';

import { api } from './api';

const ENDPOINT = '/devices';

/** Sair da conta não espera a rede: passado isso, o logout segue sem o descadastro. */
const UNREGISTER_TIMEOUT_MS = 3000;

/** Último token deste aparelho registrado na sessão; o logout o descadastra (AUD MOB-01). */
let tokenRegistrado: string | null = null;

export async function register(payload: RegisterDeviceDto): Promise<DeviceTokenResponseDto> {
  const { data } = await api.post<DeviceTokenResponseDto>(ENDPOINT, payload);
  tokenRegistrado = payload.token;
  return data;
}

/**
 * Descadastra o token deste aparelho, para o push parar de chegar depois do
 * logout (AUD MOB-01). Chamar **antes** de limpar a sessão: a rota exige o
 * Bearer. A falha é ignorada: a API também apaga o token quando o FCM o
 * devolve como `UNREGISTERED`.
 */
export async function unregisterCurrent(): Promise<void> {
  const token = tokenRegistrado;
  if (!token) return;
  tokenRegistrado = null;
  try {
    // O token do FCM tem `:`, que não pode ir cru no caminho.
    await api.delete(`${ENDPOINT}/${encodeURIComponent(token)}`, {
      timeout: UNREGISTER_TIMEOUT_MS,
    });
  } catch {
    // Best-effort, como o registro.
  }
}
