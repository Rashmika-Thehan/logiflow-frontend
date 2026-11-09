import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket, type Namespace } from '@/lib/socket';

/** Opens one Socket.IO connection for a namespace while `enabled`, and closes it on unmount. */
export function useSocket(namespace: Namespace, enabled = true) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        const s = createSocket(namespace);
        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));
        s.connect();
        setSocket(s);
        return () => {
            s.removeAllListeners();
            s.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, [namespace, enabled]);

    return { socket, connected };
}