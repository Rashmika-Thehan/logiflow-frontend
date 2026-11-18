import { Bell } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { alertsApi } from '@/api/alerts.api';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/format';
import { EASE_BRAND } from '@/lib/utils';
import { selectUnreadCount, useAlertsStore } from '@/stores/alertsStore';
import type { AlertNotification } from '@/types';

const dot: Record<AlertNotification['severity'], string> = {
    INFO: 'bg-status-busy',
    WARNING: 'bg-status-break',
    CRITICAL: 'bg-status-urgent',
};

export function AlertBell() {
    const [open, setOpen] = useState(false);
    const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [actionError, setActionError] = useState('');
    const wrapper = useRef<HTMLDivElement>(null);
    const alerts = useAlertsStore((s) => s.alerts);
    const unread = useAlertsStore(selectUnreadCount);
    const active = alerts.filter((a) => !a.acknowledgedAt);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const acknowledge = async (id: string) => {
        setAcknowledgingId(id);
        setActionError('');
        useAlertsStore.getState().markAcknowledged(id);
        try {
            await alertsApi.acknowledge(id);
        } catch {
            useAlertsStore.getState().setAlerts(await alertsApi.list(false).catch(() => alerts));
            setActionError('Could not mark this alert as read. Please try again.');
        } finally {
            setAcknowledgingId(null);
        }
    };

    const acknowledgeAll = async () => {
        setMarkingAll(true);
        setActionError('');
        useAlertsStore.getState().markAllAcknowledged();
        try {
            await alertsApi.acknowledgeAll();
        } catch {
            useAlertsStore.getState().setAlerts(await alertsApi.list(false).catch(() => alerts));
            setActionError('Could not mark all alerts as read. Please try again.');
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div ref={wrapper} className="relative">
            <button
                type="button"
                aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="relative rounded-lg p-2 transition-colors duration-300 ease-brand hover:bg-surface-4"
            >
                <Bell size={24} aria-hidden="true" />
                {unread > 0 && (
                    <span className="caption-3 absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-status-urgent px-1 text-surface-0">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label="Alerts"
                        className="absolute right-0 top-full z-50 mt-2 flex max-h-96 w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-y-auto rounded-2xl border border-surface-5 bg-surface-2 p-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3, ease: EASE_BRAND }}
                    >
                        {actionError && <p role="alert" className="rounded-lg bg-status-urgent/10 p-2 caption-2 text-status-urgent">{actionError}</p>}
                        {active.length > 0 && (
                            <div className="flex justify-end px-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={markingAll || acknowledgingId !== null}
                                    onClick={() => void acknowledgeAll()}
                                >
                                    {markingAll ? 'Marking all…' : 'Mark all as read'}
                                </Button>
                            </div>
                        )}
                        {active.length === 0 ? (
                            <p className="body-6 p-3 text-fg-muted">No active alerts. New alerts appear here as they happen.</p>
                        ) : (
                            active.map((a) => (
                                <article key={a.id} className="flex flex-col gap-2 rounded-lg bg-surface-3 p-3">
                                    <div className="flex items-start gap-2">
                                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot[a.severity]}`} aria-hidden="true" />
                                        <div className="flex flex-col gap-1">
                                            <p className="title-4">{a.title}</p>
                                            <p className="body-6 text-fg-muted">{a.body}</p>
                                            <p className="caption-5 text-fg-muted">
                                                {a.severity.charAt(0) + a.severity.slice(1).toLowerCase()}, {timeAgo(a.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-fit"
                                        disabled={markingAll || acknowledgingId !== null}
                                        onClick={() => void acknowledge(a.id)}
                                    >
                                        {acknowledgingId === a.id ? 'Marking read…' : 'Mark as read'}
                                    </Button>
                                </article>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
