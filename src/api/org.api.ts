import { api } from './client';
import type {
    ApiKeyItem,
    Branch,
    CreatedApiKey,
    DispatchSettings,
    Invitation,
    JoinRequest,
    TenantJoinCode,
    UserRole,
} from '@/types';

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
    list: () => api.get<Branch[]>('/branches').then((res) => res.data),
    create: (input: CreateBranchInput) => api.post<Branch>('/branches', input).then((res) => res.data),
    update: (id: string, input: Partial<CreateBranchInput>) =>
        api.patch<Branch>(`/branches/${id}`, input).then((res) => res.data),
    remove: (id: string) => api.delete(`/branches/${id}`).then((res) => res.data),
};

export const invitationsApi = {
    list: () => api.get<Invitation[]>('/invitations').then((res) => res.data),
    create: (input: { email: string; role: 'DRIVER' | 'DISPATCHER' }) =>
        api.post<{ id: string; email: string; role: UserRole }>('/invitations', input).then((res) => res.data),
    revoke: (id: string) => api.delete(`/invitations/${id}`).then((res) => res.data),
};

export const joinRequestsAdminApi = {
    list: (status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') =>
        api.get<JoinRequest[]>('/join-requests', { params: { status } }).then((res) => res.data),
    approve: (id: string, role?: UserRole) =>
        api.post(`/join-requests/${id}/approve`, { role }).then((res) => res.data),
    reject: (id: string, reason?: string) =>
        api.post(`/join-requests/${id}/reject`, { reason }).then((res) => res.data),
};

export const dispatchApi = {
    getSettings: () => api.get<DispatchSettings>('/dispatch/settings').then((res) => res.data),
    updateSettings: (input: DispatchSettingsInput) =>
        api.put<DispatchSettings>('/dispatch/settings', input).then((res) => res.data),
};

export const joinCodeApi = {
    get: () => api.get<TenantJoinCode>('/tenant/join-code').then((res) => res.data),
    generate: () => api.post<TenantJoinCode>('/tenant/join-code').then((res) => res.data),
    rotate: () => api.post<TenantJoinCode>('/tenant/join-code').then((res) => res.data),
    disable: () => api.delete<TenantJoinCode>('/tenant/join-code').then((res) => res.data),
};

export const apiKeysApi = {
    list: () => api.get<ApiKeyItem[]>('/api-keys').then((res) => res.data),
    create: (input: { name: string; scopes: string[]; allowedIps?: string[] }) =>
        api.post<CreatedApiKey>('/api-keys', input).then((res) => res.data),
    revoke: (id: string) => api.delete(`/api-keys/${id}`).then((res) => res.data),
};