import { api } from './client';

export interface PublicTracking {
  trackingCode: string;
  status: string;
  priority: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
}

export const shipmentsApi = {
  track: (code: string) =>
    api.get<PublicTracking>(`/shipments/track/${encodeURIComponent(code)}`).then((res) => res.data),
};
