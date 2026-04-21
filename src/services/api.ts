import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_URL = 'http://localhost:3000';
const API_TIMEOUT_MS = 10000;

type TokenProvider = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let tokenProvider: TokenProvider | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  timeout: API_TIMEOUT_MS,
});

export function setTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

async function withAuthorizationHeader(config: InternalAxiosRequestConfig) {
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token not available — request proceeds without auth
    }
  }

  return config;
}

function handleApiError(error: AxiosError) {
  if (error.response?.status === 401) {
    unauthorizedHandler?.();
  }

  return Promise.reject(error);
}

api.interceptors.request.use(withAuthorizationHeader);
api.interceptors.response.use((response) => response, handleApiError);
