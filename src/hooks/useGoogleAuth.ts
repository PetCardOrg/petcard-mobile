import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin, isCancelledResponse } from '@react-native-google-signin/google-signin';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';

// Fecha a aba do navegador ao voltar para o app depois do consentimento.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/**
 * No Android o login é nativo (`@react-native-google-signin`): o Google não
 * aceita mais o retorno por scheme customizado que o `expo-auth-session` usa
 * em client Android (`400 invalid_request`). O login nativo acha o client
 * Android pelo pacote + SHA-1 da assinatura e devolve um ID token emitido
 * para o client **Web** — que precisa estar no mesmo projeto do Google Cloud.
 * O iOS segue no `expo-auth-session`.
 */
const LOGIN_NATIVO = Platform.OS === 'android';

/**
 * Só há login Google se o client ID que a plataforma atual usa estiver
 * configurado. No iOS, o `Google.useAuthRequest` **lança** se o ID faltar —
 * por isso os hooks daqui só podem ser montados quando isto retorna `true`
 * (`GoogleSignInButton` cuida disso).
 */
export function isGoogleAuthConfigured(): boolean {
  if (Platform.OS === 'ios') return !!IOS_CLIENT_ID;
  if (Platform.OS === 'android') return !!WEB_CLIENT_ID;
  return !!WEB_CLIENT_ID;
}

type GoogleAuth = {
  /** Abre o fluxo de consentimento do Google. */
  promptAsync: () => void;
  /** True enquanto a troca do ID token por sessão está em andamento. */
  inProgress: boolean;
  error: string | null;
};

type GoogleIdToken = {
  pronto: boolean;
  /** Abre o consentimento; `null` se a pessoa cancelar ou o Google não devolver token. */
  obterIdToken: () => Promise<string | null>;
};

/** Resultado do login nativo: `cancelado` não é erro, só não segue. */
type RespostaNativa = { tipo: 'cancelado' } | { tipo: 'ok'; idToken: string | null };

let nativoConfigurado = false;

async function entrarNativo(): Promise<RespostaNativa> {
  if (!nativoConfigurado) {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    nativoConfigurado = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Sem isto o Google reusa a última conta sem perguntar: quem trocou de conta
  // (ou confirma a exclusão) precisa poder escolher.
  await GoogleSignin.signOut().catch(() => null);

  const resposta = await GoogleSignin.signIn();
  if (isCancelledResponse(resposta)) return { tipo: 'cancelado' };
  return { tipo: 'ok', idToken: resposta.data.idToken };
}

/**
 * Login social com Google (mobile#54).
 *
 * Pega o ID token do Google e o troca por uma sessão do PetCard via
 * `AuthContext.loginWithGoogle` (que chama `POST /auth/google`). Os client IDs
 * vêm do `.env` (`EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`).
 *
 * Chame só de dentro de um componente que já checou `isGoogleAuthConfigured()`.
 */
export const useGoogleAuth = LOGIN_NATIVO ? useGoogleAuthNativo : useGoogleAuthNavegador;

/**
 * ID token do Google obtido na hora, **sem** abrir sessão (AUD MOB-14): é a
 * prova de identidade da conta Google para excluir a conta (D2). Nada é
 * guardado; a API aceita o token por poucos minutos.
 *
 * Mesmo cuidado do `useGoogleAuth`: só montar depois de `isGoogleAuthConfigured()`.
 */
export const useGoogleIdToken = LOGIN_NATIVO ? useGoogleIdTokenNativo : useGoogleIdTokenNavegador;

/** Exportados só para teste: no app, use `useGoogleAuth`/`useGoogleIdToken`. */
export function useGoogleAuthNativo(onError?: (message: string) => void): GoogleAuth {
  const { loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [inProgress, setInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const falhar = (message: string) => {
    setError(message);
    onError?.(message);
  };

  const entrar = async () => {
    let resposta: RespostaNativa;
    try {
      resposta = await entrarNativo();
    } catch {
      falhar(t('login.googleError'));
      return;
    }
    if (resposta.tipo === 'cancelado') return;
    if (!resposta.idToken) {
      falhar(t('login.googleNoToken'));
      return;
    }
    try {
      await loginWithGoogle(resposta.idToken);
    } catch {
      falhar(t('login.googleFailed'));
    }
  };

  return {
    promptAsync: () => {
      if (inProgress) return;
      setInProgress(true);
      setError(null);
      void entrar().finally(() => setInProgress(false));
    },
    inProgress,
    error,
  };
}

export function useGoogleIdTokenNativo(): GoogleIdToken {
  return {
    pronto: true,
    obterIdToken: async () => {
      try {
        const resposta = await entrarNativo();
        return resposta.tipo === 'ok' ? resposta.idToken : null;
      } catch {
        return null;
      }
    },
  };
}

function useGoogleAuthNavegador(onError?: (message: string) => void): GoogleAuth {
  const { loginWithGoogle } = useAuth();
  const { t } = useTranslation();
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
      const message = response.error?.message ?? t('login.googleError');
      setError(message);
      onError?.(message);
      return;
    }

    if (response.type !== 'success') return;

    const idToken = response.params?.id_token ?? response.authentication?.idToken ?? null;
    if (!idToken) {
      const message = t('login.googleNoToken');
      setError(message);
      onError?.(message);
      return;
    }

    setInProgress(true);
    setError(null);
    loginWithGoogle(idToken)
      .catch(() => {
        const message = t('login.googleFailed');
        setError(message);
        onError?.(message);
      })
      .finally(() => setInProgress(false));
  }, [response, loginWithGoogle, onError, t]);

  return {
    promptAsync: () => {
      if (!request) return;
      void promptAsync();
    },
    inProgress,
    error,
  };
}

function useGoogleIdTokenNavegador(): GoogleIdToken {
  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  return {
    pronto: request !== null,
    obterIdToken: async () => {
      const result = await promptAsync();
      if (result.type !== 'success') return null;
      return result.params?.id_token ?? result.authentication?.idToken ?? null;
    },
  };
}
