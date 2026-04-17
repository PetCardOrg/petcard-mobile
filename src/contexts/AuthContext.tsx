import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  refreshAsync,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { setTokenProvider, setUnauthorizedHandler } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = 'dev-3ctynkt3ic4soew6.us.auth0.com';
const AUTH0_CLIENT_ID = 'CtwyNYEawT7g2BKffN1VcXyii2jgDJN0';
const AUTH0_AUDIENCE = 'https://api.petcard.local';
const AUTH0_SCOPE = 'openid profile email offline_access';

const STORE_ACCESS_TOKEN = 'auth_access_token';
const STORE_REFRESH_TOKEN = 'auth_refresh_token';
const STORE_USER = 'auth_user';

const redirectUri = makeRedirectUri({ scheme: 'petcard' });

type User = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserInfo(accessToken: string): Promise<User> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return response.json();
}

async function saveTokens(accessToken: string, refreshToken: string | null, user: User) {
  await SecureStore.setItemAsync(STORE_ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(STORE_REFRESH_TOKEN, refreshToken);
  }
  await SecureStore.setItemAsync(STORE_USER, JSON.stringify(user));
}

async function clearTokens() {
  await SecureStore.deleteItemAsync(STORE_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORE_REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(STORE_USER);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const discovery = useAutoDiscovery(`https://${AUTH0_DOMAIN}`);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: AUTH0_SCOPE.split(' '),
      extraParams: { audience: AUTH0_AUDIENCE },
      usePKCE: true,
    },
    discovery,
  );

  const isAuthenticated = user !== null;

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync(STORE_USER);
        const storedAccessToken = await SecureStore.getItemAsync(STORE_ACCESS_TOKEN);

        if (storedUser && storedAccessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handle auth response
  useEffect(() => {
    if (!response || response.type !== 'success' || !discovery) return;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tokenResult = await exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: response.params.code,
            redirectUri,
            extraParams: { code_verifier: request?.codeVerifier ?? '' },
          },
          discovery,
        );

        const userInfo = await fetchUserInfo(tokenResult.accessToken);
        await saveTokens(tokenResult.accessToken, tokenResult.refreshToken ?? null, userInfo);
        setUser(userInfo);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Authentication failed'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [response, discovery, request?.codeVerifier]);

  const login = useCallback(async () => {
    setError(null);
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setError(null);
  }, []);

  // Connect token provider to api.ts
  useEffect(() => {
    if (!discovery) return;

    setTokenProvider(async () => {
      const accessToken = await SecureStore.getItemAsync(STORE_ACCESS_TOKEN);
      if (!accessToken) return null;

      // Try to refresh if we have a refresh token
      const refreshToken = await SecureStore.getItemAsync(STORE_REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const tokenResult = await refreshAsync(
            { clientId: AUTH0_CLIENT_ID, refreshToken },
            discovery,
          );
          await SecureStore.setItemAsync(STORE_ACCESS_TOKEN, tokenResult.accessToken);
          if (tokenResult.refreshToken) {
            await SecureStore.setItemAsync(STORE_REFRESH_TOKEN, tokenResult.refreshToken);
          }
          return tokenResult.accessToken;
        } catch {
          // Refresh failed — return stored token, let 401 handler deal with it
        }
      }

      return accessToken;
    });

    setUnauthorizedHandler(() => {
      clearTokens().then(() => setUser(null));
    });

    return () => {
      setTokenProvider(null);
      setUnauthorizedHandler(null);
    };
  }, [discovery]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated, isLoading, error, login, logout }),
    [user, isAuthenticated, isLoading, error, login, logout],
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
