import { api } from './client';
import type { PlatformDriverRow, PlatformDriverUser, PlatformDriverItem } from '@/types';

export const platformDriversApi = {
  /**
   * Fetches the technical and compliance driver rows from driver-service.
   * If needsReview is true, backend returns only drivers with blockers or pending review.
   */
  listDrivers: (needsReview?: boolean): Promise<PlatformDriverRow[]> =>
    api
      .get<PlatformDriverRow[] | { data: PlatformDriverRow[] }>('/drivers/platform', {
        params: needsReview ? { needsReview: 'true' } : undefined,
      })
      .then((res) => (Array.isArray(res.data) ? res.data : res.data.data ?? [])),

  /**
   * Fetches the identity accounts (name, email, phone) from identity-service.
   */
  listUsers: (): Promise<PlatformDriverUser[]> =>
    api
      .get<PlatformDriverUser[] | { data: PlatformDriverUser[] }>('/users/platform-drivers')
      .then((res) => (Array.isArray(res.data) ? res.data : res.data.data ?? [])),

  /**
   * Approves and stamps a driver's commercial license.
   */
  verifyLicense: (driverId: string): Promise<PlatformDriverRow> =>
    api.patch<PlatformDriverRow>(`/drivers/${driverId}/verify-license`).then((res) => res.data),

  /**
   * Revokes a driver's license verification and takes them offline immediately.
   */
  revokeVerification: (driverId: string): Promise<PlatformDriverRow> =>
    api.patch<PlatformDriverRow>(`/drivers/${driverId}/revoke-verification`).then((res) => res.data),

  /**
   * Merges compliance telemetry with identity profile.
   */
  listMerged: async (needsReview?: boolean): Promise<PlatformDriverItem[]> => {
    const [drivers, users] = await Promise.all([
      platformDriversApi.listDrivers(needsReview),
      platformDriversApi.listUsers().catch(() => [] as PlatformDriverUser[]),
    ]);

    const usersMap = new Map<string, PlatformDriverUser>();
    for (const u of users) {
      usersMap.set(u.id, u);
    }

    return drivers.map((d) => ({
      ...d,
      user: usersMap.get(d.driverId),
    }));
  },
};
