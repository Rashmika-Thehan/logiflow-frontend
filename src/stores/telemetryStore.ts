import { create } from 'zustand';
import type { DriverTelemetry } from '@/types';

interface TelemetryState {
    drivers: Record<string, DriverTelemetry>;
    upsertMany: (positions: DriverTelemetry[]) => void;
    remove: (driverId: string) => void;
    pruneOlderThan: (maxAgeMs: number) => void;
    clear: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
    drivers: {},

    // Ignores any position older than the one we already hold for that driver.
    upsertMany: (positions) =>
        set((state) => {
            let next: Record<string, DriverTelemetry> | null = null;
            for (const p of positions) {
                const current = (next ?? state.drivers)[p.driverId];
                if (current && current.ts >= p.ts) continue;
                next ??= { ...state.drivers };
                next[p.driverId] = p;
            }
            return next ? { drivers: next } : state;
        }),

    remove: (driverId) =>
        set((state) => {
            if (!(driverId in state.drivers)) return state;
            const rest = { ...state.drivers };
            delete rest[driverId];
            return { drivers: rest };
        }),

    pruneOlderThan: (maxAgeMs) =>
        set((state) => {
            const cutoff = Date.now() - maxAgeMs;
            const entries = Object.entries(state.drivers).filter(([, d]) => d.ts >= cutoff);
            return entries.length === Object.keys(state.drivers).length ? state : { drivers: Object.fromEntries(entries) };
        }),

    clear: () => set({ drivers: {} }),
}));