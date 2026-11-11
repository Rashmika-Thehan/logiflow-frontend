import { api } from './client';
import type { Vehicle, VehicleClass } from '@/types';

export interface CreateVehicleInput {
    licensePlate: string;
    vehicleClass: VehicleClass;
    maxWeightKg: number;
    volumeM3: number;
    insuranceExpiry?: string;
}

export const vehiclesApi = {
    list: () => api.get<Vehicle[] | { data: Vehicle[] }>('/vehicles').then((r) => r.data),
    create: (input: CreateVehicleInput) => api.post<Vehicle>('/vehicles', input).then((r) => r.data),
    assign: (vehicleId: string, driverId: string) => api.patch(`/vehicles/${vehicleId}/assign/${driverId}`),
    setMaintenance: (vehicleId: string, state: Vehicle['maintenanceState']) =>
        api.patch(`/vehicles/${vehicleId}/maintenance`, { state }),
    setInsurance: (vehicleId: string, insuranceExpiry: string) =>
        api.patch(`/vehicles/${vehicleId}/insurance`, { insuranceExpiry }),
};