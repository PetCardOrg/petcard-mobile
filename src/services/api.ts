import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_API_URL = 'http://localhost:3000';
const API_TIMEOUT_MS = 10000;

type UnauthorizedHandler = () => void;

let accessToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  timeout: API_TIMEOUT_MS,
});

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function clearApiAccessToken() {
  accessToken = null;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function withAuthorizationHeader(config: InternalAxiosRequestConfig) {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

function handleApiError(error: AxiosError) {
  if (error.response?.status === 401) {
    clearApiAccessToken();
    unauthorizedHandler?.();
  }

  return Promise.reject(error);
}

api.interceptors.request.use(withAuthorizationHeader);
api.interceptors.response.use((response) => response, handleApiError);
