import { api } from './client';
import type { DispatchSettings } from '@/types';

export interface CreateBranchInput {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone?: string;
}

export interface DispatchSettingsInput {
    allowPlatformDrivers: boolean;
    maxOwnAttempts: number;
    acknowledgeDataSharing?: boolean;
}

export const branchesApi = {
    create: (input: CreateBranchInput) => api.post('/branches', input).then((res) => res.data),
};

export const dispatchApi = {
    updateSettings: (input: DispatchSettingsInput) =>
        api.put<DispatchSettings>('/dispatch/settings', input).then((res) => res.data),
};

// The backend response shape for join codes is not documented. We accept `joinCode` or `code`.
type JoinCodeResponse = { joinCode?: string | null; code?: string | null };
const readCode = (data: JoinCodeResponse) => data.joinCode ?? data.code ?? null;

export const joinCodeApi = {
    get: () => api.get<JoinCodeResponse>('/tenant/join-code').then((res) => readCode(res.data)),
    generate: () => api.post<JoinCodeResponse>('/tenant/join-code').then((res) => readCode(res.data)),
};