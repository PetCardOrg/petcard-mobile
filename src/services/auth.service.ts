import { api } from './api';

const AUTH_ENDPOINT = '/auth';

type SessionResponse = {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    profile_image_url?: string;
    email_verified?: boolean;
  };
};

/** Inicia o "esqueci minha senha". A API sempre responde 202 (anti-enumeração). */
export async function forgotPassword(email: string): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/password/forgot`, { email });
}

/** Conclui a redefinição com o token do e-mail e a nova senha. */
export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/password/reset`, { token, password });
}

/** Confirma o e-mail a partir do token do link. */
export async function verifyEmail(token: string): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/email/verify`, { token });
}

/** Reenvia o e-mail de verificação ao tutor autenticado. */
export async function resendVerification(): Promise<void> {
  await api.post(`${AUTH_ENDPOINT}/email/resend`);
}

/** Troca o ID token do Google por uma sessão do PetCard. */
export async function googleLogin(idToken: string): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>(`${AUTH_ENDPOINT}/google`, {
    idToken,
  });
  return data;
}
