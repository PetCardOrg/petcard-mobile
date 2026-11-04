import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import { setTokenProvider, setUnauthorizedHandler } from '../services/api';
import { authService, deviceService, tutorService, uploadService } from '../services';

const STORE_ACCESS_TOKEN = 'auth_access_token';
const STORE_USER = 'auth_user';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profile_image_url?: string;
  email_verified?: boolean;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    extras?: { phone?: string; photoUri?: string },
  ) => Promise<{
    /** Conta criada, mas a foto ou o telefone não foram salvos. */
    extrasPendentes: boolean;
  }>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  /** Re-busca o tutor em /tutors/me e atualiza a sessão (ex.: após verificar o e-mail pelo navegador). */
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(accessToken: string, user: User) {
  await SecureStore.setItemAsync(STORE_ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(STORE_USER, JSON.stringify(user));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(STORE_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORE_USER);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isAuthenticated = user !== null;

  // Usuário atual para callbacks estáveis (`refreshUser`) lerem sem depender de `user`.
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync(STORE_USER);
        const storedToken = await SecureStore.getItemAsync(STORE_ACCESS_TOKEN);

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        await clearSession();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  // Connect token provider to api.ts
  useEffect(() => {
    setTokenProvider(async () => {
      return SecureStore.getItemAsync(STORE_ACCESS_TOKEN);
    });

    setUnauthorizedHandler(() => {
      clearSession().then(() => setUser(null));
    });

    return () => {
      setTokenProvider(null);
      setUnauthorizedHandler(null);
    };
  }, []);

  /**
   * Parte comum de login, login Google e cadastro: liga o loading, abre a
   * sessão com `abrir` e grava o resultado. Em caso de erro, guarda e relança.
   */
  const startSession = useCallback(
    async (fallback: string, abrir: () => Promise<{ access_token: string; user: User }>) => {
      try {
        setIsLoading(true);
        setError(null);

        const { access_token, user: userData } = await abrir();

        await saveSession(access_token, userData);
        setUser(userData);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(fallback);
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const login = useCallback(
    (email: string, password: string) =>
      startSession('Login failed', () => authService.login(email, password)),
    [startSession],
  );

  const loginWithGoogle = useCallback(
    (idToken: string) =>
      startSession('Google login failed', () => authService.googleLogin(idToken)),
    [startSession],
  );

  const register = useCallback(
    (
      name: string,
      email: string,
      password: string,
      extras?: { phone?: string; photoUri?: string },
    ) => {
      let extrasPendentes = false;
      return startSession('Registration failed', async () => {
        const { access_token, user: userData } = await authService.register(name, email, password);

        // Salva o token antes de tentar foto/telefone: upload de imagem e
        // PATCH /tutors/me exigem Authorization, e o interceptor do axios lê
        // o token do SecureStore, não de uma variável local.
        await SecureStore.setItemAsync(STORE_ACCESS_TOKEN, access_token);

        let finalUser: User = userData;
        if (extras?.phone || extras?.photoUri) {
          try {
            let profileImageUrl: string | undefined;
            if (extras.photoUri) {
              profileImageUrl = await uploadService.uploadImage(extras.photoUri, 'tutors');
            }
            finalUser = await tutorService.updateCurrentTutor({
              ...(extras.phone ? { phone: extras.phone } : {}),
              ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
            });
          } catch {
            // A conta já foi criada — segue sem foto/telefone, dá pra
            // completar depois no perfil. Não vale derrubar o cadastro por
            // isso, mas a tela avisa o tutor (AUD MOB-16).
            extrasPendentes = true;
          }
        }

        return { access_token, user: finalUser };
      }).then(() => ({ extrasPendentes }));
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    // Antes de limpar a sessão, porque a rota precisa do Bearer (AUD MOB-01).
    // No logout forçado por 401 o token já não vale; lá a limpeza fica com a
    // API, que apaga o token quando o FCM o recusa.
    try {
      await deviceService.unregisterCurrent();
    } catch {
      // Sair da conta nunca depende da rede.
    }
    await clearSession();
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback(
    async (patch: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...patch };
      await SecureStore.setItemAsync(STORE_USER, JSON.stringify(updated));
      setUser(updated);
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    try {
      const me = (await tutorService.getCurrentTutor()) as {
        name?: string;
        phone?: string | null;
        profile_image_url?: string | null;
        email_verified?: boolean;
      };
      // Monta o usuário fora do updater do `setUser`: o React pode rodá-lo
      // depois, e aí o SecureStore ficava com o usuário antigo.
      const prev = userRef.current;
      if (!prev) return;
      const merged: User = {
        ...prev,
        name: me.name ?? prev.name,
        phone: me.phone ?? prev.phone,
        profile_image_url: me.profile_image_url ?? prev.profile_image_url,
        email_verified: me.email_verified ?? prev.email_verified,
      };
      setUser(merged);
      await SecureStore.setItemAsync(STORE_USER, JSON.stringify(merged));
    } catch {
      // Atualização em segundo plano — falha de rede não deve incomodar o usuário.
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resendVerification = useCallback(async () => {
    await authService.resendVerification();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isBootstrapping,
      isLoading,
      error,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
      refreshUser,
      forgotPassword,
      resendVerification,
    }),
    [
      user,
      isAuthenticated,
      isBootstrapping,
      isLoading,
      error,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
      refreshUser,
      forgotPassword,
      resendVerification,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
