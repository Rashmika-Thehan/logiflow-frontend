import 'leaflet/dist/leaflet.css';
import type { ReactNode } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_ATTRIBUTION, TILE_URL } from '@/lib/map';
import { cn } from '@/lib/utils';

interface BaseMapProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
    children?: ReactNode;
}

export function BaseMap({ center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, className, children }: BaseMapProps) {
    return (
        <MapContainer center={center} zoom={zoom} className={cn('h-full w-full', className)} scrollWheelZoom>
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />
            {children}
        </MapContainer>
    );
}