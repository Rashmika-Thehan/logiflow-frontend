import type { DriverTelemetry } from '@/types';

export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Fallback view until we know the tenant's depot. Colombo. */
export const DEFAULT_CENTER: [number, number] = [6.9271, 79.8612];
export const DEFAULT_ZOOM = 12;

export type MarkerState = 'available' | 'busy' | 'stale';
export const STALE_AFTER_MS = 60_000;

export const markerState = (driver: DriverTelemetry, now: number): MarkerState =>
    now - driver.ts > STALE_AFTER_MS ? 'stale' : driver.shipmentId ? 'busy' : 'available';