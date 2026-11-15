import { api } from './client';
import type { TeamMember } from '@/types';

export type { TeamMember };

export interface UserProfile {
    id: string;
    email: string;
    role: string;
    fullName?: string | null;
    phone?: string | null;
    hasPassword: boolean;
    isGoogleUser: boolean;
    createdAt: string;
}

export const usersApi = {
    list: () =>
        api.get<TeamMember[] | { data: TeamMember[] }>('/users').then((r) => {
            const data = r.data;
            return Array.isArray(data) ? data : data.data ?? [];
        }),

    getProfile: () => api.get<UserProfile>('/users/me').then((r) => r.data),

    updateProfile: (data: { fullName?: string; phone?: string }) =>
        api.patch<UserProfile>('/users/me', data).then((r) => r.data),

    changePassword: (data: { currentPassword?: string; newPassword: string }) =>
        api.post<{ success: boolean; message: string }>('/users/me/password', data).then((r) => r.data),
};

export const memberLabel = (m: Pick<TeamMember, 'id' | 'fullName' | 'email'>) =>
    m.fullName ?? m.email ?? `Member ${m.id.slice(0, 8)}`;