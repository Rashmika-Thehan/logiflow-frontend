import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from '@/api/client';

/** Namespaces exposed by the gateway. */
export type Namespace = '/live' | '/ingest' | '/track';

/** Factory only. Hooks decide when to connect, so nothing opens on the landing page. */
export const createSocket = (namespace: Namespace): Socket =>
  io(`${API_ORIGIN}${namespace}`, { withCredentials: true, autoConnect: false, transports: ['websocket'] });
