import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assignmentsApi } from '@/api/dispatch.api';
import { getErrorMessage } from '@/api/client';
import { shipmentsApi } from '@/api/shipments.api';
import { PriorityTag, StatusBadge } from '@/components/common/StatusBadge';
import { CandidateCard } from '@/components/dashboard/CandidateCard';
import { PageShell } from '@/components/dashboard/PageShell';
import { Button } from '@/components/ui/button';
import { priorityRank } from '@/lib/dispatch';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { Shipment } from '@/types';

type Notice = { tone: 'ok' | 'error'; text: string };

const useQueue = (status: 'PENDING' | 'DISPATCHING') =>
    useQuery({
        queryKey: ['dispatch-queue', status],
        queryFn: () => shipmentsApi.list({ page: 1, limit: 50, status }),
        refetchInterval: 10_000,
    });

export default function Dispatch() {
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('shipment');
    const queryClient = useQueryClient();
    const detailRef = useRef<HTMLDivElement>(null);
    const [notice, setNotice] = useState<Notice | null>(null);

    const pending = useQueue('PENDING');
    const dispatching = useQueue('DISPATCHING');

    const queue = useMemo(
        () =>
            [...(pending.data?.data ?? []), ...(dispatching.data?.data ?? [])].sort(
                (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.createdAt.localeCompare(b.createdAt),
            ),
        [pending.data, dispatching.data],
    );
    const selected: Shipment | undefined = queue.find((s) => s.id === selectedId);
    const loading = pending.isPending || dispatching.isPending;
    const failed = pending.isError || dispatching.isError;

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(t);
    }, [notice]);

    useEffect(() => {
        if (selected && window.matchMedia('(max-width: 1023px)').matches) {
            detailRef.current?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start',
            });
        }
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const select = (id: string | null) =>
        setParams((p) => {
            const copy = new URLSearchParams(p);
            if (id) copy.set('shipment', id);
            else copy.delete('shipment');
            return copy;
        });

    const hasCoords = selected?.recipientLat !== undefined && selected?.recipientLng !== undefined;
    const candidates = useQuery({
        queryKey: ['candidates', selected?.id],
        queryFn: () =>
            assignmentsApi.candidates({
                weightKg: selected!.weightKg,
                lat: selected!.recipientLat as number,
                lng: selected!.recipientLng as number,
            }),
        enabled: !!selected && hasCoords,
        refetchInterval: 15_000,
    });

    const history = useQuery({
        queryKey: ['assignments', selected?.id],
        queryFn: () => assignmentsApi.byShipment(selected!.id),
        enabled: !!selected,
    });

    const assign = useMutation({
        mutationFn: (v: { shipmentId: string; driverId: string }) => assignmentsApi.override(v),
        onSuccess: () => {
            setNotice({ tone: 'ok', text: `Offer sent for ${selected?.trackingCode}. The driver has a limited time to accept.` });
            select(null);
            void queryClient.invalidateQueries({ queryKey: ['dispatch-queue'] });
            void queryClient.invalidateQueries({ queryKey: ['shipments'] });
        },
        onError: (err) =>
            setNotice({ tone: 'error', text: getErrorMessage(err, 'The driver could not be assigned. Pick another driver or try again.') }),
    });

    return (
        <PageShell title="Dispatch console">
            {notice && (
                <p
                    role="status"
                    className={`body-5 rounded-lg border border-surface-5 bg-surface-3 px-3 py-2 ${notice.tone === 'error' ? 'text-status-urgent' : 'text-status-available'}`}
                >
                    {notice.text}
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <section aria-labelledby="queue-heading" className="flex flex-col gap-3">
                    <h2 id="queue-heading" className="title-2">
                        Waiting for a driver{queue.length > 0 ? `, ${queue.length}` : ''}
                    </h2>

                    {failed ? (
                        <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                            <p className="title-3">The queue could not be loaded</p>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    void pending.refetch();
                                    void dispatching.refetch();
                                }}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading queue">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-2xl bg-surface-3" />
                            ))}
                        </div>
                    ) : queue.length === 0 ? (
                        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6">
                            <p className="title-3">Every shipment has a driver</p>
                            <p className="body-6 text-fg-muted">New shipments that need dispatching appear here automatically.</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {queue.map((s) => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        aria-pressed={s.id === selectedId}
                                        onClick={() => select(s.id)}
                                        className={`flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-colors duration-300 ease-brand ${s.id === selectedId ? 'border-fg bg-surface-3' : 'border-surface-5 bg-surface-2 hover:bg-surface-3'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="body-4">{s.trackingCode}</span>
                                            <PriorityTag priority={s.priority} />
                                        </div>
                                        <p className="body-6 text-fg-muted">{s.recipientAddress}</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <StatusBadge status={s.status} />
                                            <span className="caption-2 text-fg-muted">
                                                {s.weightKg} kg, waiting {timeAgo(s.createdAt).replace(' ago', '')}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section ref={detailRef} aria-labelledby="detail-heading" className="flex scroll-mt-4 flex-col gap-3">
                    <h2 id="detail-heading" className="title-2">
                        Ranked drivers
                    </h2>

                    {!selectedId ? (
                        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6">
                            <p className="title-3">Select a shipment</p>
                            <p className="body-6 text-fg-muted">Pick one from the queue to see which drivers fit best and assign one by hand.</p>
                        </div>
                    ) : !selected ? (
                        <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                            <p className="title-3">This shipment is no longer waiting</p>
                            <p className="body-6 text-fg-muted">It was assigned, cancelled or delivered since you opened it.</p>
                            <Button variant="secondary" onClick={() => select(null)}>
                                Back to the queue
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-surface-5 bg-surface-2 p-4">
                                <p className="body-4">{selected.trackingCode}</p>
                                <p className="body-6">{selected.recipientAddress}</p>
                                <p className="caption-2 text-fg-muted">
                                    {selected.weightKg} kg, {selected.lengthCm} x {selected.widthCm} x {selected.heightCm} cm. Window:{' '}
                                    {formatDateTime(selected.deliveryWindowStart)} to {formatDateTime(selected.deliveryWindowEnd)}
                                </p>
                            </div>

                            {!hasCoords ? (
                                <p role="alert" className="body-6 text-status-urgent">
                                    This shipment has no coordinates, so drivers cannot be ranked. Edit the shipment or recreate it with a location.
                                </p>
                            ) : candidates.isPending ? (
                                <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading candidates">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-32 rounded-2xl bg-surface-3" />
                                    ))}
                                </div>
                            ) : candidates.isError ? (
                                <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                                    <p className="title-3">Candidates could not be loaded</p>
                                    <Button variant="secondary" onClick={() => void candidates.refetch()}>
                                        Try again
                                    </Button>
                                </div>
                            ) : candidates.data.length === 0 ? (
                                <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6">
                                    <p className="title-3">No drivers fit right now</p>
                                    <p className="body-6 text-fg-muted">
                                        Drivers must be available and have a vehicle with enough capacity. This list refreshes every 15 seconds.
                                    </p>
                                </div>
                            ) : (
                                <ol className="flex flex-col gap-2">
                                    {candidates.data.map((c, i) => (
                                        <li key={c.driverId}>
                                            <CandidateCard
                                                candidate={c}
                                                rank={i + 1}
                                                assigning={assign.isPending && assign.variables?.driverId === c.driverId}
                                                disabled={assign.isPending}
                                                onAssign={() => assign.mutate({ shipmentId: selected.id, driverId: c.driverId })}
                                            />
                                        </li>
                                    ))}
                                </ol>
                            )}

                            {history.data && history.data.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <h3 className="title-4 text-fg-muted">Earlier attempts</h3>
                                    <ul className="flex flex-col gap-1">
                                        {history.data.map((a) => (
                                            <li key={a.id} className="body-6 flex justify-between gap-3 rounded-lg bg-surface-3 px-3 py-2">
                                                <span>Driver {a.driverId.slice(0, 8)}</span>
                                                <span className="text-fg-muted">{a.status.toLowerCase().replace(/_/g, ' ')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </PageShell>
    );
}