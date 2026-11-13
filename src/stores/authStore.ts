import { create } from 'zustand';
import { clearTokens, setSessionExpiredHandler, setTokens } from '@/api/client';
import type { UserContext, UserRole } from '@/types';
import { authApi, type LoginInput, type RegisterInput } from '@/api/auth.api';

type Status = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: UserContext | null;
  status: Status;
  bootstrap: () => Promise<void>;
  register: (input: RegisterInput) => Promise<UserContext>;
  login: (input: LoginInput) => Promise<UserContext>;
  logout: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  // GET /auth/me. A 401 is refreshed and replayed by the axios interceptor.
  bootstrap: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });
    try {
      // Pick up tokens if arriving from OAuth redirect
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlAccessToken = params.get('accessToken');
        const urlRefreshToken = params.get('refreshToken');
        if (urlAccessToken) {
          setTokens(urlAccessToken, urlRefreshToken || undefined);
          params.delete('accessToken');
          params.delete('refreshToken');
          const remaining = params.toString();
          const cleanUrl = window.location.pathname + (remaining ? `?${remaining}` : '') + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      set({ user: await authApi.me(), status: 'authenticated' });
    } catch {
      clearTokens();
      set({ user: null, status: 'anonymous' });
    }
  },

  register: async (input) => {
    const res = await authApi.register(input);
    setTokens(res.data?.accessToken, res.data?.refreshToken);
    const user = await authApi.me();
    set({ user, status: 'authenticated' });
    return user;
  },

  login: async (input) => {
    const res = await authApi.login(input);
    setTokens(res.data?.accessToken, res.data?.refreshToken);
    const user = await authApi.me();
    set({ user, status: 'authenticated' });
    return user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      set({ user: null, status: 'anonymous' });
    }
  },

  clear: () => {
    clearTokens();
    set({ user: null, status: 'anonymous' });
  },
}));

setSessionExpiredHandler(() => useAuthStore.getState().clear());

export const homePathForRole = (role: UserRole) => (role === 'DRIVER' ? '/driver' : '/dashboard/dispatch');
