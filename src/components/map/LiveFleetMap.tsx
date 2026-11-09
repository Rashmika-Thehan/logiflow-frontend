import { useMemo } from 'react';
import { useLiveFleet } from '@/hooks/useLiveFleet';
import { useNow } from '@/hooks/useNow';
import { markerState } from '@/lib/map';
import { useTelemetryStore } from '@/stores/telemetryStore';
import { BaseMap } from './BaseMap';
import { DriverMarker } from './DriverMarker';

interface Props {
    selectedId?: string | null;
    onSelect?: (driverId: string) => void;
}

export function LiveFleetMap({ selectedId, onSelect }: Props) {
    const { connected } = useLiveFleet();
    const drivers = useTelemetryStore((s) => s.drivers);
    const now = useNow();
    const list = useMemo(() => Object.values(drivers), [drivers]);

    return (
        <div className="relative h-full w-full">
            <BaseMap>
                {list.map((d) => (
                    <DriverMarker
                        key={d.driverId}
                        driver={d}
                        state={markerState(d, now)}
                        selected={d.driverId === selectedId}
                        onSelect={onSelect}
                    />
                ))}
            </BaseMap>

            <div
                className="caption-1 absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-lg border border-surface-5 bg-surface-2/80 px-3 py-2 backdrop-blur-md"
                role="status"
            >
                <span
                    className={`h-2 w-2 rounded-full ${connected ? 'bg-status-available' : 'bg-status-break'}`}
                    aria-hidden="true"
                />
                {connected ? `Live, ${list.length} reporting` : 'Connecting to live feed'}
            </div>

            {list.length === 0 && (
                <div className="absolute inset-x-3 bottom-3 z-[1000] mx-auto max-w-sm rounded-2xl border border-surface-5 bg-surface-2/90 p-4 backdrop-blur-md">
                    <p className="title-3">No drivers reporting yet</p>
                    <p className="body-6 text-fg-muted">
                        Positions appear here as soon as drivers go on shift and share their location.
                    </p>
                </div>
            )}
        </div>
    );
}