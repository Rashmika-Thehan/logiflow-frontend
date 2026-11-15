import { api } from './client';

export interface PingInput {
    lat: number;
    lng: number;
    ts: number;
    speedKmh?: number;
    heading?: number;
    accuracyM?: number;
}

export interface IngestResult {
    stored: number;
    live: boolean;
    invalid: number;
}

export const trackingApi = {
    sendPings: (pings: PingInput[]): Promise<IngestResult> =>
        api.post<IngestResult>('/tracking/pings', { pings }).then((r) => r.data),
};
