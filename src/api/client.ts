import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const API_ORIGIN: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Cookie based JWT: the browser sends httpOnly accessToken / refreshToken on every call. */
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Endpoints that must never trigger a refresh attempt. */
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshInFlight: Promise<void> | null = null;
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

/**
 * One shared refresh call. Every request that hits a 401 while it runs awaits the
 * same promise, which acts as the queue, then replays itself once.
 * Bare axios is used so this call skips the interceptor below.
 */
const refreshSession = (): Promise<void> => {
  refreshInFlight ??= axios
    .post(`${API_ORIGIN}/api/v1/auth/refresh`, {}, { withCredentials: true })
    .then(() => undefined)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = NO_REFRESH.some((path) => original?.url?.startsWith(path));

    if (!original || error.response?.status !== 401 || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshSession();
      return api(original);
    } catch (refreshError) {
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);

/** Pulls a readable message out of a NestJS style error body. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return fallback;
};
