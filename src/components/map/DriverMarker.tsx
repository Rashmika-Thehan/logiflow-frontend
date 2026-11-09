import L from 'leaflet';
import { memo, useMemo } from 'react';
import { Marker } from 'react-leaflet';
import type { MarkerState } from '@/lib/map';
import type { DriverTelemetry } from '@/types';

const ARROW =
    '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 10 10 6 8 2 10Z" fill="#000000"/></svg>';

const buildIcon = (state: MarkerState, heading: number, selected: boolean) =>
    L.divIcon({
        className: `driver-marker driver-marker--${state}${selected ? ' driver-marker--selected' : ''}`,
        html: `<span class="driver-marker__pulse"></span><span class="driver-marker__dot" style="transform:rotate(${heading}deg)">${ARROW}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

interface Props {
    driver: DriverTelemetry;
    state: MarkerState;
    selected?: boolean;
    onSelect?: (driverId: string) => void;
}

function DriverMarkerBase({ driver, state, selected = false, onSelect }: Props) {
    // Heading is rounded to 5 degrees so tiny changes do not rebuild the icon.
    const heading = Math.round((driver.heading || 0) / 5) * 5;
    const icon = useMemo(() => buildIcon(state, heading, selected), [state, heading, selected]);

    return (
        <Marker
            position={[driver.lat, driver.lng]}
            icon={icon}
            title={`Driver ${driver.driverId.slice(0, 8)}`}
            eventHandlers={{ click: () => onSelect?.(driver.driverId) }}
        />
    );
}

export const DriverMarker = memo(DriverMarkerBase);