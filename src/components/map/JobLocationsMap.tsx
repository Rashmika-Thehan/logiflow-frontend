import { useEffect } from 'react';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import { BaseMap } from './BaseMap';

export interface JobLocation {
  lat: number;
  lng: number;
  label: string;
}

interface Props {
  pickup: JobLocation;
  destination?: JobLocation | null;
  className?: string;
}

function FitLocations({ pickup, destination }: Pick<Props, 'pickup' | 'destination'>) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [[pickup.lat, pickup.lng]];
    if (destination) points.push([destination.lat, destination.lng]);
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 14 });
  }, [map, pickup.lat, pickup.lng, destination?.lat, destination?.lng]);

  return null;
}

const pin = (letter: string, color: string) => L.divIcon({
  className: 'job-location-pin',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 2px 8px #0006;font-weight:700">${letter}</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const pickupPin = pin('P', '#16845b');
const destinationPin = pin('D', '#5b5bd6');

export function JobLocationsMap({ pickup, destination, className }: Props) {
  return (
    <div className={`h-48 w-full overflow-hidden rounded-xl ${className ?? ''}`}>
      <BaseMap center={[pickup.lat, pickup.lng]} zoom={12}>
        <FitLocations pickup={pickup} destination={destination} />
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupPin} title={pickup.label} />
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationPin} title={destination.label} />}
      </BaseMap>
    </div>
  );
}
