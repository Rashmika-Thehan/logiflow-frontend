import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useTelemetryStore } from '@/stores/telemetryStore';
import type { DriverTelemetry } from '@/types';

const FLUSH_MS = 500;
const PRUNE_EVERY_MS = 30_000;
const DROP_AFTER_MS = 10 * 60_000;

const isValid = (p: DriverTelemetry) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.ts);

/**
 * Subscribes to the `/live` namespace (dispatcher or admin cookies required) and feeds
 * the telemetry store. Positions are buffered and flushed twice a second so a busy fleet
 * does not re-render the map on every ping.
 */
export function useLiveFleet(enabled = true) {
    const { socket, connected } = useSocket('/live', enabled);

    useEffect(() => {
        if (!socket) return;
        const buffer = new Map<string, DriverTelemetry>();

        const onPosition = (p: DriverTelemetry) => {
            if (isValid(p)) buffer.set(p.driverId, p);
        };
        const flush = () => {
            if (buffer.size === 0) return;
            useTelemetryStore.getState().upsertMany([...buffer.values()]);
            buffer.clear();
        };

        socket.on('position', onPosition);
        const flushTimer = setInterval(flush, FLUSH_MS);
        const pruneTimer = setInterval(() => useTelemetryStore.getState().pruneOlderThan(DROP_AFTER_MS), PRUNE_EVERY_MS);

        return () => {
            socket.off('position', onPosition);
            clearInterval(flushTimer);
            clearInterval(pruneTimer);
        };
    }, [socket]);

    return { connected };
}