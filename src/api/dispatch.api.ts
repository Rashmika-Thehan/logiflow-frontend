import { api } from './client';

// The candidate and assignment response shapes are not documented in detail.
// Every field except `driverId` and `score` is treated as optional.
export interface DispatchCandidate {
    driverId: string;
    driverName?: string;
    score: number;
    distanceKm?: number;
    breakdown?: { distance?: number; capacity?: number; shift?: number };
    vehicle?: { licensePlate?: string; vehicleClass?: string; maxWeightKg?: number };
}

export interface AssignmentRecord {
    id: string;
    driverId: string;
    status: string;
    createdAt?: string;
}

export interface CandidateParams {
    weightKg: number;
    lat: number;
    lng: number;
}

export const assignmentsApi = {
    candidates: (params: CandidateParams) =>
        api.get<DispatchCandidate[]>('/assignments/candidates', { params }).then((r) => r.data),
    byShipment: (shipmentId: string) =>
        api.get<AssignmentRecord[]>(`/assignments/by-shipment/${shipmentId}`).then((r) => r.data),
    override: (input: { shipmentId: string; driverId: string }) => api.post('/assignments/override', input),
};