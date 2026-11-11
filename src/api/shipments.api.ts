import { api } from './client';
import type { Paginated, PriorityTier, Shipment, ShipmentStatus } from '@/types';

export interface PublicTracking {
  trackingCode: string;
  status: string;
  priority: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
}

export interface ListShipmentsParams {
  page: number;
  limit: number;
  status?: ShipmentStatus;
}

export interface CreateShipmentInput {
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientAddress: string;
  recipientLat: number;
  recipientLng: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  priority: PriorityTier;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
}

export const shipmentsApi = {
  track: (code: string) => api.get<PublicTracking>(`/shipments/track/${encodeURIComponent(code)}`).then((res) => res.data),
  list: (params: ListShipmentsParams) => api.get<Paginated<Shipment>>('/shipments', { params }).then((r) => r.data),
  create: (input: CreateShipmentInput) => api.post<Shipment>('/shipments', input).then((r) => r.data),
  cancel: (id: string) => api.post(`/shipments/${id}/cancel`),
  reissueOtp: (id: string) => api.post(`/shipments/${id}/reissue-otp`),
};