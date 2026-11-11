import { Button } from '@/components/ui/button';
import type { DispatchCandidate } from '@/api/dispatch.api';
import { toPercent } from '@/lib/dispatch';

function Bar({ label, value }: { label: string; value?: number }) {
    if (value === undefined) return null;
    const pct = toPercent(value);
    return (
        <div className="flex flex-col gap-1">
            <div className="caption-2 flex justify-between text-fg-muted">
                <span>{label}</span>
                <span>{pct.toFixed(0)}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface-5">
                <div
                    className="h-full origin-left rounded-full bg-fg transition-transform duration-500 ease-brand"
                    style={{ transform: `scaleX(${pct / 100})` }}
                />
            </div>
        </div>
    );
}

interface Props {
    candidate: DispatchCandidate;
    rank: number;
    assigning: boolean;
    disabled: boolean;
    onAssign: () => void;
}

export function CandidateCard({ candidate: c, rank, assigning, disabled, onAssign }: Props) {
    const name = c.driverName ?? `Driver ${c.driverId.slice(0, 8)}`;
    const vehicle = [c.vehicle?.vehicleClass, c.vehicle?.licensePlate, c.vehicle?.maxWeightKg ? `${c.vehicle.maxWeightKg} kg max` : '']
        .filter(Boolean)
        .join(', ');

    return (
        <article className="flex flex-col gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <p className="caption-1 text-fg-muted">Rank {rank}</p>
                    <h3 className="title-3">{name}</h3>
                    <p className="caption-2 text-fg-muted">
                        {[c.distanceKm !== undefined ? `${c.distanceKm.toFixed(1)} km away` : '', vehicle].filter(Boolean).join(', ') || 'No extra details'}
                    </p>
                </div>
                <p className="heading-5" aria-label={`Match score ${toPercent(c.score).toFixed(1)}`}>
                    {toPercent(c.score).toFixed(1)}
                </p>
            </div>
            {c.breakdown && (
                <div className="grid gap-2 sm:grid-cols-3">
                    <Bar label="Distance" value={c.breakdown.distance} />
                    <Bar label="Capacity" value={c.breakdown.capacity} />
                    <Bar label="Shift" value={c.breakdown.shift} />
                </div>
            )}
            <Button className="w-fit" disabled={disabled} onClick={onAssign}>
                {assigning ? 'Assigning' : 'Assign this driver'}
            </Button>
        </article>
    );
}