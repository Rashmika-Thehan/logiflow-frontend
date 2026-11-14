import { useEffect, useState, useRef, useCallback } from 'react';
import { shipmentsApi } from '@/api/shipments.api';
import { createSocket } from '@/lib/socket';
import type { PublicTracking, LiveTripPosition, LiveTripSubscribeResponse } from '@/types';
import type { Socket } from 'socket.io-client';

export interface TrackingState {
  shipment: PublicTracking | null;
  driverPos: { lat: number; lng: number; heading: number } | null;
  destPos: { lat: number; lng: number } | null;
  etaMinutes: number | null;
  isLive: boolean;
  isPending: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePublicTracking(trackingCode?: string): TrackingState {
  const [shipment, setShipment] = useState<PublicTracking | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number; heading: number } | null>(null);
  const [destPos, setDestPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const normalizedCode = trackingCode?.trim().toUpperCase();

  const loadShipment = useCallback(async () => {
    if (!normalizedCode) return;
    setIsPending(true);
    setError(null);
    try {
      const data = await shipmentsApi.track(normalizedCode);
      setShipment(data);
    } catch {
      setError('No package was found matching this tracking reference.');
    } finally {
      setIsPending(false);
    }
  }, [normalizedCode]);

  // Initial fetch and polling fallback
  useEffect(() => {
    if (!normalizedCode) {
      setShipment(null);
      setDriverPos(null);
      setDestPos(null);
      setEtaMinutes(null);
      setError(null);
      return;
    }

    void loadShipment();

    // Polling fallback every 20s if socket is offline or inactive
    const interval = setInterval(() => {
      if (!isLive) {
        void loadShipment();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [normalizedCode, loadShipment, isLive]);

  // Socket.IO live connection
  useEffect(() => {
    if (!normalizedCode) return;

    const socket = createSocket('/track');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsLive(true);
      socket.emit(
        'subscribe',
        { trackingCode: normalizedCode },
        (res: LiveTripSubscribeResponse) => {
          if (res?.ok) {
            if (res.destLat && res.destLng) {
              setDestPos({ lat: res.destLat, lng: res.destLng });
            }
            if (res.status) {
              setShipment((prev) => (prev ? { ...prev, status: res.status! } : prev));
            }
          }
        },
      );
    });

    socket.on('position', (pos: LiveTripPosition) => {
      if (typeof pos?.lat === 'number' && typeof pos?.lng === 'number') {
        setDriverPos({
          lat: pos.lat,
          lng: pos.lng,
          heading: pos.heading ?? 0,
        });
      }
      if (typeof pos?.eta === 'number') {
        setEtaMinutes(pos.eta);
      }
    });

    socket.on('ended', ({ status }: { status: string }) => {
      setShipment((prev) => (prev ? { ...prev, status } : prev));
      setDriverPos(null);
      setEtaMinutes(null);
    });

    socket.on('disconnect', () => {
      setIsLive(false);
    });

    socket.on('connect_error', () => {
      setIsLive(false);
    });

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsLive(false);
    };
  }, [normalizedCode]);

  return {
    shipment,
    driverPos,
    destPos,
    etaMinutes,
    isLive,
    isPending,
    error,
    refetch: loadShipment,
  };
}
