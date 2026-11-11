import { create } from 'zustand';
import type { AlertNotification } from '@/types';

const MAX_ALERTS = 100;
const sortNewest = (list: AlertNotification[]) =>
    [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ALERTS);

interface AlertsState {
    alerts: AlertNotification[];
    setAlerts: (list: AlertNotification[]) => void;
    add: (alert: AlertNotification) => void;
    markAcknowledged: (id: string) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
    alerts: [],
    setAlerts: (list) => set({ alerts: sortNewest(list) }),
    add: (alert) => set((s) => ({ alerts: sortNewest([alert, ...s.alerts.filter((a) => a.id !== alert.id)]) })),
    markAcknowledged: (id) =>
        set((s) => ({
            alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a)),
        })),
}));

export const selectUnreadCount = (s: AlertsState) => s.alerts.reduce((n, a) => (a.acknowledgedAt ? n : n + 1), 0);