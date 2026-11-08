import { api, API_ORIGIN } from './client';
import type { UserContext } from '@/types';

export interface LoginInput { email: string; password: string }
export interface RegisterInput { tenantName: string; email: string; password: string }

export const authApi = {
  login: (input: LoginInput) => api.post<{ message: string }>('/auth/login', input),
  register: (input: RegisterInput) => api.post<{ message: string }>('/auth/register', input),
  me: () => api.get<UserContext>('/auth/me').then((res) => res.data),
  logout: () => api.post('/auth/logout'),
  googleUrl: `${API_ORIGIN}/api/v1/auth/google`,
};
