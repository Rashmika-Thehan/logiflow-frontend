import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { insuranceState, vehicleClassLabel } from '@/lib/vehicle';
import type { Vehicle } from '@/types';

const insuranceText = {
    expired: { label: 'Expired', tone: 'text-status-urgent' },
    soon: { label: 'Expires soon', tone: 'text-status-break' },
    ok: { label: 'Valid', tone: 'text-status-available' },
    unknown: { label: 'No expiry on file', tone: 'text-fg-muted' },
} as const;

interface Props {
    vehicle: Vehicle;
    driverLabel: string | null;
    busy: boolean;
    onToggleMaintenance: () => void;
    onAssign: () => void;
    onInsurance: () => void;
}

export function VehicleCard({ vehicle: v, driverLabel, busy, onToggleMaintenance, onAssign, onInsurance }: Props) {
    const inMaintenance = v.maintenanceState === 'IN_MAINTENANCE';
    const ins = insuranceText[insuranceState(v.insuranceExpiry)];

    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-surface-5 bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h3 className="heading-6">{v.licensePlate}</h3>
                    <p className="caption-2 text-fg-muted">{vehicleClassLabel(v.vehicleClass)}</p>
                </div>
                <span className="caption-1 inline-flex items-center gap-2 rounded-lg border border-surface-5 bg-surface-3 px-2 py-1">
                    <span
                        className={`h-2 w-2 rounded-full ${inMaintenance ? 'bg-status-break' : 'bg-status-available'}`}
                        aria-hidden="true"
                    />
                    {inMaintenance ? 'In maintenance' : 'Operational'}
                </span>
            </div>

            <dl className="grid grid-cols-2 gap-3">
                <div>
                    <dt className="caption-2 text-fg-muted">Max load</dt>
                    <dd className="body-5">{v.maxWeightKg} kg</dd>
                </div>
                <div>
                    <dt className="caption-2 text-fg-muted">Volume</dt>
                    <dd className="body-5">{v.volumeM3} m³</dd>
                </div>
                <div>
                    <dt className="caption-2 text-fg-muted">Insurance</dt>
                    <dd className="body-5">
                        {formatDate(v.insuranceExpiry)}
                        <span className={`caption-2 block ${ins.tone}`}>{ins.label}</span>
                    </dd>
                </div>
                <div>
                    <dt className="caption-2 text-fg-muted">Driver</dt>
                    <dd className="body-5">{driverLabel ?? 'Unassigned'}</dd>
                </div>
            </dl>

            <div className="flex flex-wrap gap-1">
                <Button variant="secondary" size="sm" disabled={busy} onClick={onToggleMaintenance}>
                    {inMaintenance ? 'Return to service' : 'Send to maintenance'}
                </Button>
                <Button variant="ghost" size="sm" onClick={onAssign}>
                    Assign driver
                </Button>
                <Button variant="ghost" size="sm" onClick={onInsurance}>
                    Update insurance
                </Button>
            </div>
        </article>
    );
}