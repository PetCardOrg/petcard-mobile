import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { api, setTokenProvider, setUnauthorizedHandler } from '../services/api';
import { authService, tutorService, uploadService } from '../services';

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
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  /** Re-busca o tutor em /tutors/me e atualiza a sessão (ex.: após verificar o e-mail pelo navegador). */
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      await saveSession(access_token, userData);
      setUser(userData);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Login failed');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { access_token, user: userData } = await authService.googleLogin(idToken);

      await saveSession(access_token, userData);
      setUser(userData);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Google login failed');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      extras?: { phone?: string; photoUri?: string },
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.post('/auth/register', {
          name,
          email,
          password,
        });
        const { access_token, user: userData } = response.data;

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
            // isso.
          }
        }

        await saveSession(access_token, finalUser);
        setUser(finalUser);
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Registration failed');
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
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
      let next: User | null = null;
      setUser((prev) => {
        if (!prev) return prev;
        next = {
          ...prev,
          name: me.name ?? prev.name,
          phone: me.phone ?? prev.phone,
          profile_image_url: me.profile_image_url ?? prev.profile_image_url,
          email_verified: me.email_verified ?? prev.email_verified,
        };
        return next;
      });
      if (next) {
        await SecureStore.setItemAsync(STORE_USER, JSON.stringify(next));
      }
    } catch {
      // Atualização em segundo plano — falha de rede não deve incomodar o usuário.
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await authService.resetPassword(token, password);
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
      resetPassword,
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
      resetPassword,
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
