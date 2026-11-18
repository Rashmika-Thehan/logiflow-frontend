import { api } from './client';
import type { AlertNotification } from '@/types';

export const alertsApi = {
    list: (includeAcknowledged = false) =>
        api.get<AlertNotification[]>('/alerts', { params: { includeAcknowledged } }).then((r) => r.data),
    acknowledge: (id: string) => api.post(`/alerts/${id}/acknowledge`),
    acknowledgeAll: () => api.post<{ acknowledged: boolean; count: number }>('/alerts/acknowledge-all'),
};
