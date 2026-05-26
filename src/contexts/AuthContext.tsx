import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { api, setTokenProvider, setUnauthorizedHandler } from '../services/api';

const STORE_ACCESS_TOKEN = 'auth_access_token';
const STORE_USER = 'auth_user';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
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

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      const { access_token, user: userData } = response.data;

      await saveSession(access_token, userData);
      setUser(userData);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Registration failed');
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, isLoading, error, login, register, logout }),
    [user, isAuthenticated, isLoading, error, login, register, logout],
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
