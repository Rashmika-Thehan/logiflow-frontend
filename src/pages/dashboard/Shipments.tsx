import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '@/api/client';
import { shipmentsApi } from '@/api/shipments.api';
import { PriorityTag, StatusBadge } from '@/components/common/StatusBadge';
import { CreateShipmentDialog } from '@/components/dashboard/CreateShipmentDialog';
import { PageShell } from '@/components/dashboard/PageShell';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatDateTime } from '@/lib/format';
import { statusLabel } from '@/lib/shipment';
import type { Shipment, ShipmentStatus } from '@/types';
import { PlusIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { BatchImportDialog } from '@/components/dashboard/BatchImportDialog';

const PAGE_SIZE = 20;
const STATUSES: ShipmentStatus[] = ['PENDING', 'DISPATCHING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];
const CLOSED: ShipmentStatus[] = ['DELIVERED', 'CANCELLED', 'FAILED'];

type Notice = { tone: 'ok' | 'error'; text: string };

export default function Shipments() {
    const [params, setParams] = useSearchParams();
    const page = Math.max(1, Number(params.get('page')) || 1);
    const status = (STATUSES as string[]).includes(params.get('status') ?? '') ? (params.get('status') as ShipmentStatus) : undefined;

    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [toCancel, setToCancel] = useState<Shipment | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(t);
    }, [notice]);

    const { data, isPending, isError, isFetching, refetch } = useQuery({
        queryKey: ['shipments', page, status],
        queryFn: () => shipmentsApi.list({ page, limit: PAGE_SIZE, status }),
        placeholderData: keepPreviousData,
    });

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['shipments'] });

    const cancel = useMutation({
        mutationFn: (s: Shipment) => shipmentsApi.cancel(s.id),
        onSuccess: (_r, s) => {
            setToCancel(null);
            setNotice({ tone: 'ok', text: `Shipment ${s.trackingCode} was cancelled.` });
            void refresh();
        },
        onError: (err) => {
            setToCancel(null);
            setNotice({ tone: 'error', text: getErrorMessage(err, 'The shipment could not be cancelled. Try again.') });
        },
    });

    const reissue = useMutation({
        mutationFn: (s: Shipment) => shipmentsApi.reissueOtp(s.id),
        onSuccess: (_r, s) => setNotice({ tone: 'ok', text: `A new delivery code was sent to the recipient of ${s.trackingCode}.` }),
        onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'A new delivery code could not be sent. Try again.') }),
    });

    const setFilter = (next: ShipmentStatus | '') =>
        setParams((p) => {
            const copy = new URLSearchParams(p);
            if (next) copy.set('status', next);
            else copy.delete('status');
            copy.delete('page');
            return copy;
        });

    const goToPage = (n: number) =>
        setParams((p) => {
            const copy = new URLSearchParams(p);
            copy.set('page', String(n));
            return copy;
        });

    const rows = data?.data ?? [];

    return (
        <PageShell
            title="Shipments"
            actions={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setImportOpen(true)}>
                        <UploadSimpleIcon size={16} aria-hidden="true" />
                        Batch import
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon size={16} aria-hidden="true" />
                        Create shipment
                    </Button>
                </div>
            }
        >
            {notice && (
                <p
                    role="status"
                    className={`body-5 rounded-lg border border-surface-5 bg-surface-3 px-3 py-2 ${notice.tone === 'error' ? 'text-status-urgent' : 'text-status-available'}`}
                >
                    {notice.text}
                </p>
            )}

            <div className="flex items-center gap-3">
                <label htmlFor="status-filter" className="caption-1 text-fg-muted">
                    Status
                </label>
                <select
                    id="status-filter"
                    value={status ?? ''}
                    onChange={(e) => setFilter(e.target.value as ShipmentStatus | '')}
                    className="body-5 rounded-lg border border-surface-5 bg-surface-3 px-3 py-2"
                >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {statusLabel(s)}
                        </option>
                    ))}
                </select>
                {isFetching && !isPending && <span className="caption-2 text-fg-muted">Updating</span>}
            </div>

            {isError ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                    <p className="title-3">Shipments could not be loaded</p>
                    <p className="body-6 text-fg-muted">Check your connection and try again.</p>
                    <Button variant="secondary" onClick={() => void refetch()}>
                        Try again
                    </Button>
                </div>
            ) : isPending ? (
                <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading shipments">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-surface-3" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                    <p className="title-3">{status ? `No ${statusLabel(status).toLowerCase()} shipments` : 'No shipments yet'}</p>
                    <p className="body-6 text-fg-muted">
                        {status ? 'Try another status, or clear the filter.' : 'Create your first shipment to start dispatching.'}
                    </p>
                    {!status && <Button onClick={() => setCreateOpen(true)}>Create shipment</Button>}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-surface-5 bg-surface-2">
                    <table className="w-full min-w-[56rem] text-left">
                        <thead>
                            <tr className="caption-1 border-b border-surface-5 text-fg-muted">
                                {['Tracking code', 'Recipient', 'Status', 'Priority', 'Weight', 'Delivery window', 'Actions'].map((h) => (
                                    <th key={h} scope="col" className="px-4 py-3">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => (
                                <tr key={s.id} className="border-b border-surface-5 last:border-b-0">
                                    <td className="body-5 px-4 py-3">{s.trackingCode}</td>
                                    <td className="px-4 py-3">
                                        <p className="body-5">{s.recipientName}</p>
                                        <p className="caption-5 text-fg-muted">{s.recipientAddress}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <PriorityTag priority={s.priority} />
                                    </td>
                                    <td className="body-6 px-4 py-3">{s.weightKg} kg</td>
                                    <td className="caption-2 px-4 py-3 text-fg-muted">
                                        {formatDateTime(s.deliveryWindowStart)}
                                        <br />
                                        to {formatDateTime(s.deliveryWindowEnd)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {s.status === 'IN_TRANSIT' && (
                                                <Button variant="ghost" size="sm" disabled={reissue.isPending} onClick={() => reissue.mutate(s)}>
                                                    Reissue code
                                                </Button>
                                            )}
                                            {!CLOSED.includes(s.status) && (
                                                <Button variant="ghost" size="sm" onClick={() => setToCancel(s)}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <p className="caption-2 text-fg-muted">
                        Page {data.page} of {data.totalPages}, {data.total} shipments
                    </p>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                            Previous
                        </Button>
                        <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <BatchImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

            <CreateShipmentDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(code) => {
                    setCreateOpen(false);
                    setNotice({ tone: 'ok', text: `Shipment ${code} was created and sent to dispatch.` });
                    void refresh();
                }}
            />

            <Modal open={!!toCancel} onClose={() => setToCancel(null)} title="Cancel this shipment?">
                <p className="body-6 text-fg-muted">
                    {toCancel?.trackingCode} will stop dispatching and the driver, if one is assigned, will be released. This cannot be undone.
                </p>
                <div className="flex gap-2">
                    <Button disabled={cancel.isPending} onClick={() => toCancel && cancel.mutate(toCancel)}>
                        {cancel.isPending ? 'Cancelling' : 'Cancel shipment'}
                    </Button>
                    <Button variant="ghost" onClick={() => setToCancel(null)}>
                        Keep shipment
                    </Button>
                </div>
            </Modal>
        </PageShell>
    );
}