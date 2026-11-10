import { api } from './client';
import type { DriverTelemetry } from '@/types';

// Response shapes are not documented in the spec. We assume arrays of DriverTelemetry.
export interface NearbyParams { lat: number; lng: number; radiusKm?: number; limit?: number }
export interface BoxParams { minLat: number; maxLat: number; minLng: number; maxLng: number; limit?: number }
export interface ReplayPoint { lat: number; lng: number; ts: number }

export const trackingApi = {
    nearby: (params: NearbyParams) =>
        api.get<DriverTelemetry[]>('/tracking/drivers/nearby', { params }).then((r) => r.data),
    inBox: (params: BoxParams) =>
        api.get<DriverTelemetry[]>('/tracking/drivers/in-box', { params }).then((r) => r.data),
    position: (driverId: string) =>
        api.get<DriverTelemetry>(`/tracking/drivers/${driverId}/position`).then((r) => r.data),
    replay: (shipmentId: string, limit = 500) =>
        api.get<ReplayPoint[]>(`/tracking/trips/${shipmentId}/replay`, { params: { limit } }).then((r) => r.data),
};