import { statusLabel } from '@/lib/shipment';
import type { PriorityTier, ShipmentStatus } from '@/types';

const statusDot: Record<ShipmentStatus, string> = {
    PENDING: 'bg-fg-muted',
    DISPATCHING: 'bg-status-break',
    ASSIGNED: 'bg-status-busy',
    PICKED_UP: 'bg-status-busy',
    IN_TRANSIT: 'bg-status-busy',
    DELIVERED: 'bg-status-available',
    CANCELLED: 'bg-fg-muted',
    FAILED: 'bg-status-urgent',
};

export function StatusBadge({ status }: { status: ShipmentStatus }) {
    const label = statusLabel(status);
    const dot = statusDot[status];
    return (
        <span className="caption-1 inline-flex items-center gap-2 rounded-lg border border-surface-5 bg-surface-3 px-2 py-1">
            <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
            {label}
        </span>
    );
}

const priorityStyle: Record<PriorityTier, { label: string; text: string }> = {
    URGENT: { label: 'Urgent', text: 'text-status-urgent' },
    EXPRESS: { label: 'Express', text: 'text-status-break' },
    STANDARD: { label: 'Standard', text: 'text-fg-muted' },
};

export function PriorityTag({ priority }: { priority: PriorityTier }) {
    const { label, text } = priorityStyle[priority];
    return <span className={`caption-1 ${text}`}>{label}</span>;
}