import { api, API_ORIGIN, getRefreshToken } from './client';
import type { UserContext } from '@/types';

export interface LoginInput {
  email: string;
  password: string;
}
export interface RegisterInput {
  tenantName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input),
  register: (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input),
  me: () => api.get<UserContext>('/auth/me').then((res) => res.data),
  logout: () => api.post('/auth/logout', { refreshToken: getRefreshToken() || undefined }),
  googleUrl: `${API_ORIGIN}/api/v1/auth/google`,
};
