import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '../contexts/AuthContext';

// Fecha a aba do navegador ao voltar para o app depois do consentimento.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/**
 * Só há login Google se o client ID da plataforma atual estiver configurado.
 * O `Google.useAuthRequest` **lança** se o ID da plataforma faltar — por isso
 * o hook `useGoogleAuth` só pode ser montado quando isto retorna `true`
 * (`GoogleSignInButton` cuida disso).
 */
export function isGoogleAuthConfigured(): boolean {
  if (Platform.OS === 'ios') return !!IOS_CLIENT_ID;
  if (Platform.OS === 'android') return !!ANDROID_CLIENT_ID;
  return !!WEB_CLIENT_ID;
}

type GoogleAuth = {
  /** Abre o fluxo de consentimento do Google. */
  promptAsync: () => void;
  /** True enquanto a troca do ID token por sessão está em andamento. */
  inProgress: boolean;
  error: string | null;
};

/**
 * Login social com Google (mobile#54).
 *
 * Pega o ID token pelo `expo-auth-session` e o troca por uma sessão do PetCard
 * via `AuthContext.loginWithGoogle` (que chama `POST /auth/google`). Os client
 * IDs vêm do `.env` (`EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`), um por plataforma.
 *
 * Chame só de dentro de um componente que já checou `isGoogleAuthConfigured()`.
 */
export function useGoogleAuth(onError?: (message: string) => void): GoogleAuth {
  const { loginWithGoogle } = useAuth();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      const message = response.error?.message ?? 'Falha na autenticação com o Google.';
      setError(message);
      onError?.(message);
      return;
    }

    if (response.type !== 'success') return;

    const idToken = response.params?.id_token ?? response.authentication?.idToken ?? null;
    if (!idToken) {
      const message = 'O Google não retornou um token válido.';
      setError(message);
      onError?.(message);
      return;
    }

    setInProgress(true);
    setError(null);
    loginWithGoogle(idToken)
      .catch(() => {
        const message = 'Não foi possível entrar com o Google.';
        setError(message);
        onError?.(message);
      })
      .finally(() => setInProgress(false));
  }, [response, loginWithGoogle, onError]);

  return {
    promptAsync: () => {
      if (!request) return;
      void promptAsync();
    },
    inProgress,
    error,
  };
}
