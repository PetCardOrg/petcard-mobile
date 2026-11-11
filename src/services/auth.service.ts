import type { TutorSessionResponseDto } from '@petcardorg/shared';

import { api } from './api';

const AUTH_ENDPOINT = '/auth';

/** Login com e-mail e senha. */
export async function login(email: string, password: string): Promise<TutorSessionResponseDto> {
  const { data } = await api.post<TutorSessionResponseDto>(`${AUTH_ENDPOINT}/login`, {
    email,
    password,
  });
  return data;
}

/** Cria a conta do tutor e já devolve a sessão. */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<TutorSessionResponseDto> {
  const { data } = await api.post<TutorSessionResponseDto>(`${AUTH_ENDPOINT}/register`, {
    name,
    email,
    password,
  });
  return data;
}

/**
 * Inicia o "esqueci minha senha". A API sempre responde 202 (anti-enumeração).
 *
 * O app só dispara o e-mail. Redefinir a senha e confirmar o endereço
 * acontecem nas páginas que a própria API serve, abertas pelo link — o token
 * não passa por aqui.
 */
export async function forgotPassword(email: string): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/password/forgot`, { email });
}

/** Reenvia o e-mail de verificação ao tutor autenticado. */
export async function resendVerification(): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/email/resend`);
}

/** Troca o ID token do Google por uma sessão do PetCard. */
export async function googleLogin(idToken: string): Promise<TutorSessionResponseDto> {
  const { data } = await api.post<TutorSessionResponseDto>(`${AUTH_ENDPOINT}/google`, {
    idToken,
  });
  return data;
}
