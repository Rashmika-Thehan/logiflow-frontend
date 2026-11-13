import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN, getAccessToken } from '@/api/client';

/** Namespaces exposed by the gateway. */
export type Namespace = '/live' | '/ingest' | '/track';

/** Factory only. Hooks decide when to connect, so nothing opens on the landing page. */
export const createSocket = (namespace: Namespace): Socket => {
  const token = getAccessToken();
  return io(`${API_ORIGIN}${namespace}`, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket'],
  });
};
