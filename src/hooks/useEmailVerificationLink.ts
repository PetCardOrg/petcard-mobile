import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';

/**
 * Trata o deep link `.../verify-email?token=...` quando o tutor já está logado.
 *
 * Nesse caso a AuthStack (que tem a tela `VerifyEmail`) não está montada, então
 * o `linking` do NavigationContainer não resolve a rota. Aqui consumimos a URL
 * direto, confirmamos o e-mail e atualizamos a sessão — o banner some sozinho.
 * Logado fora, a própria `VerifyEmailScreen` cuida disso.
 */
export function useEmailVerificationLink() {
  const url = Linking.useURL();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || !user || handled.current === url) return;

    const { path, queryParams } = Linking.parse(url);
    const token = queryParams?.token;
    if (!path?.includes('verify-email') || typeof token !== 'string') return;

    handled.current = url;
    authService
      .verifyEmail(token)
      .then(() => updateUser({ email_verified: true }))
      .then(() => Alert.alert(t('emailVerification.title'), t('emailVerification.successMessage')))
      .catch(() => Alert.alert(t('emailVerification.title'), t('emailVerification.errorMessage')));
  }, [url, user, updateUser, t]);
}
