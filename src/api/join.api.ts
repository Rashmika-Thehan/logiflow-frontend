import { api } from './client';

// The spec says `requestedRole`, the Postman collection says `role`. Confirm against the backend DTO.
const ROLE_FIELD = 'requestedRole';

export type JoinRole = 'DRIVER' | 'DISPATCHER';
export type JoinStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface JoinRequestInput {
    joinCode: string;
    email: string;
    fullName: string;
    phone: string;
    password: string;
    role: JoinRole;
}

export type PlatformDriverInput = Omit<JoinRequestInput, 'joinCode' | 'role'>;

// The create response shape is not documented. We accept `id`, `joinRequestId` or `requestId`.
type CreatedResponse = { id?: string; joinRequestId?: string; requestId?: string };
const readId = (d: CreatedResponse) => d.id ?? d.joinRequestId ?? d.requestId ?? null;

export const joinApi = {
    submit: ({ role, ...rest }: JoinRequestInput) =>
        api.post<CreatedResponse>('/join-requests', { ...rest, [ROLE_FIELD]: role }).then((r) => readId(r.data)),
    submitPlatformDriver: (input: PlatformDriverInput) =>
        api.post<CreatedResponse>('/join-requests/platform-driver', input).then((r) => readId(r.data)),
    verifyEmail: (id: string, code: string) => api.post(`/join-requests/${id}/verify-email`, { code }),
    resendCode: (id: string) => api.post(`/join-requests/${id}/resend-code`),
    status: (id: string) =>
        api.get<{ status: JoinStatus; reason?: string }>(`/join-requests/${id}/status`).then((r) => r.data),
};

export interface AcceptInviteInput {
    token: string;
    fullName: string;
    phone: string;
    password: string;
}

export const invitationsApi = {
    accept: (input: AcceptInviteInput) => api.post('/invitations/accept', input),
};