import { api } from './client';
import type { UserRole } from '@/types';

// The teammate shape is not documented. Only `id` and `role` are assumed to exist.
export interface TeamMember {
    id: string;
    email?: string;
    fullName?: string;
    role: UserRole;
}

export const usersApi = {
    list: () => api.get<TeamMember[] | { data: TeamMember[] }>('/users').then((r) => r.data),
};

export const memberLabel = (m: Pick<TeamMember, 'id' | 'fullName' | 'email'>) =>
    m.fullName ?? m.email ?? `Driver ${m.id.slice(0, 8)}`;