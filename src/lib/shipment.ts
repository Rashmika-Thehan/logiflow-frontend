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

export const statusDescriptions: Record<ShipmentStatus, string> = {
    PENDING: 'Shipment created and waiting to enter dispatch.',
    DISPATCHING: 'The system is searching for an available driver or waiting for an offer response.',
    ASSIGNED: 'A driver accepted the assignment and is heading to the pickup branch.',
    PICKED_UP: 'The driver confirmed collecting the parcel.',
    IN_TRANSIT: 'The delivery route to the recipient has started.',
    DELIVERED: 'Delivery was completed and verified with the recipient’s code.',
    CANCELLED: 'The business cancelled this shipment before pickup.',
    FAILED: 'Dispatch or delivery failed. An operator can retry the shipment.',
};

export const statusLabel = (s: ShipmentStatus) => statusLabels[s];
export const statusDescription = (s: ShipmentStatus) => statusDescriptions[s];
