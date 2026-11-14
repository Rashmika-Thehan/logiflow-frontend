import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import { BaseMap } from './BaseMap';
import { DriverMarker } from './DriverMarker';
import type { DriverTelemetry } from '@/types';

interface Props {
  destPos?: { lat: number; lng: number } | null;
  driverPos?: { lat: number; lng: number; heading: number } | null;
  className?: string;
}

function MapAutoBounds({
  destPos,
  driverPos,
}: {
  destPos?: { lat: number; lng: number } | null;
  driverPos?: { lat: number; lng: number; heading: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (destPos && driverPos) {
      const bounds = L.latLngBounds(
        [destPos.lat, destPos.lng],
        [driverPos.lat, driverPos.lng],
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    } else if (destPos) {
      map.setView([destPos.lat, destPos.lng], 14, { animate: true });
    } else if (driverPos) {
      map.setView([driverPos.lat, driverPos.lng], 14, { animate: true });
    }
  }, [map, destPos, driverPos]);

  return null;
}

const destIcon = L.divIcon({
  className: 'destination-pin',
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#ffffff;border:3px solid #111111;box-shadow:0 6px 18px rgba(0,0,0,0.5);">
      <svg width="18" height="18" viewBox="0 0 256 256" fill="#111111">
        <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.1,83.4,134.5a8.1,8.1,0,0,0,9.2,0C136,236.1,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,120a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

export function TrackingMap({ destPos, driverPos, className }: Props) {
  const center: [number, number] = useMemo(() => {
    if (destPos) return [destPos.lat, destPos.lng];
    if (driverPos) return [driverPos.lat, driverPos.lng];
    return [6.9271, 79.8612];
  }, [destPos, driverPos]);

  const driverTelemetry: DriverTelemetry | null = useMemo(() => {
    if (!driverPos) return null;
    return {
      driverId: 'active-delivery-driver',
      lat: driverPos.lat,
      lng: driverPos.lng,
      heading: driverPos.heading,
      speedKmh: 35,
      ts: Date.now(),
    };
  }, [driverPos]);

  return (
    <div className={`relative h-full w-full min-h-[300px] overflow-hidden rounded-2xl ${className || ''}`}>
      <BaseMap center={center} zoom={13} className="h-full w-full">
        <MapAutoBounds destPos={destPos} driverPos={driverPos} />

        {destPos && (
          <Marker
            position={[destPos.lat, destPos.lng]}
            icon={destIcon}
            title="Delivery Destination"
          />
        )}

        {driverTelemetry && (
          <DriverMarker
            driver={driverTelemetry}
            state="busy"
          />
        )}
      </BaseMap>

      {/* Floating Status Indicator */}
      <div className="caption-1 absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border border-surface-5 bg-surface-2/85 px-3 py-2 shadow-lg backdrop-blur-md">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            driverPos ? 'bg-status-available animate-pulse' : 'bg-status-break'
          }`}
          aria-hidden="true"
        />
        <span className="font-medium text-fg text-xs">
          {driverPos ? 'Live driver location streaming' : destPos ? 'Destination pinned' : 'Waiting for telemetry'}
        </span>
      </div>
    </div>
  );
}
