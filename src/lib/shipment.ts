import type { ShipmentStatus } from '@/types';

export const statusLabels: Record<ShipmentStatus, string> = {
    PENDING: 'Pending',
    DISPATCHING: 'Dispatching',
    ASSIGNED: 'Assigned',
    PICKED_UP: 'Picked up',
    IN_TRANSIT: 'In transit',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
};

export const statusLabel = (s: ShipmentStatus) => statusLabels[s];