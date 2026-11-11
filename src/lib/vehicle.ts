import type { VehicleClass } from '@/types';

// Spec lists these four. The Postman collection also uses SPRINTER_VAN, so confirm the backend enum.
export const VEHICLE_CLASSES: VehicleClass[] = ['MOTORCYCLE', 'SEDAN', 'VAN', 'TRUCK'];

export const vehicleClassLabel = (value: string) => {
    const text = value.toLowerCase().replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export type InsuranceState = 'expired' | 'soon' | 'ok' | 'unknown';

export const parseDate = (value: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);

export const insuranceState = (expiry?: string, now = Date.now()): InsuranceState => {
    if (!expiry) return 'unknown';
    const days = (parseDate(expiry).getTime() - now) / 86_400_000;
    if (days < 0) return 'expired';
    return days <= 30 ? 'soon' : 'ok';
};

export const todayIso = () => new Date().toISOString().slice(0, 10);