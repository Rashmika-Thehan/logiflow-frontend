import { api } from './client';
import type { TeamMember } from '@/types';

export type { TeamMember };

export const usersApi = {
    list: () =>
        api.get<TeamMember[] | { data: TeamMember[] }>('/users').then((r) => {
            const data = r.data;
            return Array.isArray(data) ? data : data.data ?? [];
        }),
};

export const memberLabel = (m: Pick<TeamMember, 'id' | 'fullName' | 'email'>) =>
    m.fullName ?? m.email ?? `Member ${m.id.slice(0, 8)}`;