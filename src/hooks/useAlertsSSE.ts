import { useEffect, useState } from 'react';
import { alertsApi } from '@/api/alerts.api';
import { authApi } from '@/api/auth.api';
import { API_ORIGIN, getAccessToken } from '@/api/client';
import { playAlertTone } from '@/lib/audio';
import { useAlertsStore } from '@/stores/alertsStore';
import type { AlertNotification } from '@/types';

export type StreamState = 'connecting' | 'open' | 'retrying';

/**
 * Loads active alerts, then keeps `/alerts/stream` open. When the stream drops, it waits
 * (1s, 2s, 4s ... up to 30s), calls /auth/me so an expired access token is refreshed,
 * and reconnects. Alerts are re-read on every (re)connect so none are missed.
 */
export function useAlertsSSE() {
    const [state, setState] = useState<StreamState>('connecting');

    useEffect(() => {
        let source: EventSource | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let attempt = 0;
        let disposed = false;

        const seed = () =>
            alertsApi
                .list(false)
                .then((list) => useAlertsStore.getState().setAlerts(list))
                .catch(() => undefined);

        const connect = () => {
            const token = getAccessToken();
            const streamUrl = token
                ? `${API_ORIGIN}/api/v1/alerts/stream?token=${encodeURIComponent(token)}`
                : `${API_ORIGIN}/api/v1/alerts/stream`;
            source = new EventSource(streamUrl, { withCredentials: true });

            source.onopen = () => {
                attempt = 0;
                setState('open');
                void seed();
            };

            source.onmessage = (event) => {
                try {
                    const alert = JSON.parse(event.data) as AlertNotification;
                    useAlertsStore.getState().add(alert);
                    if (alert.severity === 'CRITICAL') playAlertTone();
                } catch {
                    /* ignore keep alive or malformed frames */
                }
            };

            source.onerror = () => {
                source?.close();
                if (disposed) return;
                setState('retrying');
                const delay = Math.min(30_000, 1000 * 2 ** attempt++);
                timer = setTimeout(async () => {
                    await authApi.me().catch(() => undefined);
                    if (!disposed) connect();
                }, delay);
            };
        };

        connect();
        return () => {
            disposed = true;
            clearTimeout(timer);
            source?.close();
        };
    }, []);

    return state;
}