import { api } from './client';
import type { DriverProfile, ShiftStatus, AssignmentOffer, DriverJobView } from '@/types';

export const driverApi = {
  /**
   * Fetches the current authenticated driver profile and telemetry settings.
   */
  getProfile: (): Promise<DriverProfile> =>
    api.get<DriverProfile>('/drivers/me').then((r) => r.data),

  /**
   * Updates manual shift status (OFFLINE, AVAILABLE, ON_BREAK).
   */
  setShift: (status: ShiftStatus): Promise<DriverProfile> =>
    api.patch<DriverProfile>('/drivers/me/shift', { status }).then((r) => r.data),

  /**
   * Self-reports driver's current GPS location.
   */
  updateLocation: (lat: number, lng: number): Promise<void> =>
    api.patch('/drivers/me/location', { lat, lng }).then((r) => r.data),

  /**
   * Checks for a currently active assignment offer waiting for driver response.
   */
  getActiveOffer: async (): Promise<AssignmentOffer | null> => {
    try {
      const res = await api.get<AssignmentOffer | null>('/assignment-offers/pending');
      if (res.data && res.data.id) return res.data;
    } catch {
      // fallback
    }
    try {
      const mine = await api.get<AssignmentOffer[]>('/assignment-offers/mine');
      return Array.isArray(mine.data) ? mine.data[0] ?? null : null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches the accepted/in-progress delivery commitment for this driver.
   */
  getActiveDelivery: async (): Promise<AssignmentOffer | null> => {
    try {
      const res = await api.get<AssignmentOffer[]>('/assignment-offers/active');
      return Array.isArray(res.data) ? res.data[0] ?? null : null;
    } catch {
      return null;
    }
  },

  /**
   * Responds to an incoming dispatch assignment offer (ACCEPT or REJECT).
   */
  respondOffer: (id: string, decision: 'ACCEPT' | 'REJECT'): Promise<AssignmentOffer> =>
    api.post<AssignmentOffer>(`/assignment-offers/${id}/respond`, { decision }).then((r) => r.data),

  /**
   * Fetches driver-scoped details of a delivery shipment.
   */
  getJobView: (shipmentId: string): Promise<DriverJobView> =>
    api.get<DriverJobView>(`/shipments/${shipmentId}/driver-view`).then((r) => r.data),

  /**
   * Milestone 1: Marks that the driver has arrived at the collection depot.
   */
  arrivedAtDepot: (shipmentId: string): Promise<void> =>
    api.post(`/deliveries/${shipmentId}/arrived`).then((r) => r.data),

  /**
   * Milestone 2: Confirms parcel package has been collected into vehicle.
   */
  collectedParcel: (shipmentId: string): Promise<void> =>
    api.post(`/deliveries/${shipmentId}/collected`).then((r) => r.data),

  /**
   * Milestone 3: Starts en-route transit to the customer location.
   */
  startDelivery: (shipmentId: string): Promise<void> =>
    api.post(`/deliveries/${shipmentId}/start`).then((r) => r.data),

  /**
   * Milestone 4: Completes the delivery by verifying the customer's 4-digit OTP.
   */
  confirmDelivery: (shipmentId: string, otp: string): Promise<void> =>
    api.post(`/deliveries/${shipmentId}/confirm`, { otp }).then((r) => r.data),

  /**
   * Marks a delivery attempt as failed with a reason code.
   */
  failDelivery: (shipmentId: string, reasonCode: string, photoUrl?: string): Promise<void> =>
    api.post(`/deliveries/${shipmentId}/fail`, { reasonCode, photoUrl }).then((r) => r.data),

  /**
   * Fetches past offers and assignment history.
   */
  getPastOffers: (): Promise<AssignmentOffer[]> =>
    api.get<AssignmentOffer[]>('/assignment-offers/mine').then((r) => r.data),
};
