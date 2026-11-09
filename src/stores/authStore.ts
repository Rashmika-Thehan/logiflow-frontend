import { create } from 'zustand';
import { setSessionExpiredHandler } from '@/api/client';
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
      set({ user: await authApi.me(), status: 'authenticated' });
    } catch {
      set({ user: null, status: 'anonymous' });
    }
  },

  register: async (input) => {
    await authApi.register(input);
    const user = await authApi.me();
    set({ user, status: 'authenticated' });
    return user;
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
