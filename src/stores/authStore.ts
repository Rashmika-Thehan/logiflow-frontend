import { create } from 'zustand';
import { authApi, type LoginInput } from '@/api/auth.api';
import { setSessionExpiredHandler } from '@/api/client';
import type { UserContext, UserRole } from '@/types';

type Status = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: UserContext | null;
  status: Status;
  bootstrap: () => Promise<void>;
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
      set({ user: await authApi.me(), status: 'authenticated' });
    } catch {
      set({ user: null, status: 'anonymous' });
    }
  },

  login: async (input) => {
    await authApi.login(input);
    const user = await authApi.me();
    set({ user, status: 'authenticated' });
    return user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, status: 'anonymous' });
    }
  },

  clear: () => set({ user: null, status: 'anonymous' }),
}));

setSessionExpiredHandler(() => useAuthStore.getState().clear());

export const homePathForRole = (role: UserRole) => (role === 'DRIVER' ? '/driver' : '/dashboard/dispatch');
