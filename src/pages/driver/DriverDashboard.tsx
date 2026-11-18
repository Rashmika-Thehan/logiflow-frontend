import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SteeringWheel,
  Power,
  Coffee,
  ShieldCheck,
  ShieldWarning,
  SignOut,
  Broadcast,
  Warning,
} from '@phosphor-icons/react';
import { driverApi } from '@/api/driver.api';
import { trackingApi } from '@/api/tracking.api';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { IncomingOfferModal } from '@/components/driver/IncomingOfferModal';
import { ActiveJobCard } from '@/components/driver/ActiveJobCard';
import { Button } from '@/components/ui/button';
import type { ShiftStatus, AssignmentOffer, DriverJobView } from '@/types';

export default function DriverDashboard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [activeOffer, setActiveOffer] = useState<AssignmentOffer | null>(null);
  const [activeJob, setActiveJob] = useState<DriverJobView | null>(null);
  const [shiftError, setShiftError] = useState('');

  // 1. Fetch Driver Profile
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: driverApi.getProfile,
    retry: 1,
  });

  // Compliance & eligibility checks
  const isLicenseVerified = !!profile?.licenseVerifiedAt;
  const isLicenseExpired = profile ? new Date(profile.licenseExpiry) <= new Date() : false;
  const hasVehicle = !!profile?.assignedVehicleId || !!profile?.vehicle;
  const isVehicleOperational = profile?.vehicle ? profile.vehicle.maintenanceState === 'OPERATIONAL' : true;

  let ineligibilityReason = '';
  if (!profile) {
    ineligibilityReason = 'Driver profile has not been initialized yet by your organization administrator.';
  } else if (!isLicenseVerified) {
    ineligibilityReason = 'Your driver license has not been verified by an administrator yet.';
  } else if (isLicenseExpired) {
    ineligibilityReason = 'Your driver license has expired.';
  } else if (!hasVehicle) {
    ineligibilityReason = 'No vehicle assigned. Please ask dispatch to assign an operational vehicle.';
  } else if (!isVehicleOperational) {
    ineligibilityReason = 'Your assigned vehicle is currently in maintenance.';
  }

  const isEligibleToDrive = !ineligibilityReason;

  // 2. Shift change mutation
  const shiftMutation = useMutation({
    mutationFn: (status: ShiftStatus) => driverApi.setShift(status),
    onSuccess: (updated) => {
      setShiftError('');
      void queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      if (updated.shiftStatus === 'OFFLINE') {
        setActiveOffer(null);
      }
    },
    onError: (err) => {
      setShiftError(getErrorMessage(err, 'Failed to update shift status.'));
    },
  });

  // 3. Periodic Poll for incoming offers when AVAILABLE
  const currentShift = profile?.shiftStatus ?? 'OFFLINE';
  const isAvailable = currentShift === 'AVAILABLE';

  const pollActiveOffer = useCallback(async () => {
    if (!isAvailable || activeJob) return;
    try {
      const offer = await driverApi.getActiveOffer();
      if (offer && offer.status === 'PENDING_ACCEPTANCE') {
        setActiveOffer(offer);
      } else {
        setActiveOffer(null);
      }
    } catch {
      // offline or no active offers
    }
  }, [isAvailable, activeJob]);

  useEffect(() => {
    if (!isAvailable || activeJob) return;
    void pollActiveOffer();
    const interval = setInterval(pollActiveOffer, 3000);
    return () => clearInterval(interval);
  }, [isAvailable, activeJob, pollActiveOffer]);

  // Restore active delivery on mount or while BUSY
  useEffect(() => {
    if (activeJob) return;
    let isSubscribed = true;

    const syncActiveJob = async () => {
      try {
        const accepted = await driverApi.getActiveDelivery();
        if (accepted && accepted.shipmentId && isSubscribed) {
          const job = await driverApi.getJobView(accepted.shipmentId).catch(() => null);
          if (job && job.status !== 'DELIVERED' && isSubscribed) {
            setActiveJob(job);
          }
        }
      } catch {
        // ignore
      }
    };

    void syncActiveJob();

    // If driver is BUSY, poll every 3 seconds until activeJob loads
    const interval = currentShift === 'BUSY' ? setInterval(syncActiveJob, 3000) : null;
    return () => {
      isSubscribed = false;
      if (interval) clearInterval(interval);
    };
  }, [activeJob, currentShift]);

  // 4. GPS Location Ingestion (Self-report location while on shift)
  useEffect(() => {
    if (currentShift === 'OFFLINE' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        void driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
        void trackingApi.sendPings([
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            ts: Math.floor(pos.timestamp || Date.now()),
            speedKmh: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : undefined,
            heading: pos.coords.heading != null ? Math.round(pos.coords.heading) : undefined,
            accuracyM: pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : undefined,
          },
        ]).catch(() => undefined);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentShift]);

  // Handle Offer Response
  const handleAcceptOffer = async (offerId: string) => {
    const shipmentId = activeOffer?.shipmentId;
    setActiveOffer(null);
    try {
      await driverApi.respondOffer(offerId, 'ACCEPT');
      void refetchProfile();

      if (shipmentId) {
        // Poll for job view up to 6 times while Kafka updates shipment status to ASSIGNED
        for (let i = 0; i < 6; i++) {
          try {
            const job = await driverApi.getJobView(shipmentId);
            if (job) {
              setActiveJob(job);
              break;
            }
          } catch {
            await new Promise((res) => setTimeout(res, 800));
          }
        }
      }
    } catch (err) {
      setShiftError(getErrorMessage(err, 'Failed to accept offer.'));
      void refetchProfile();
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      await driverApi.respondOffer(offerId, 'REJECT');
    } finally {
      setActiveOffer(null);
    }
  };

  const refreshJob = async () => {
    if (!activeJob) return;
    const fetchLatest = async () => {
      try {
        const updated = await driverApi.getJobView(activeJob.id);
        setActiveJob(updated);
        if (updated.status === 'DELIVERED') {
          void refetchProfile();
        }
      } catch {
        void refetchProfile();
      }
    };
    await fetchLatest();
    setTimeout(fetchLatest, 1500);
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-surface-0 px-4 py-6 pb-20 flex flex-col justify-between">
      <div className="flex flex-col gap-5">
        {/* Top Header & Logout */}
        <div className="flex items-center justify-between border-b border-surface-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fg text-surface-0 shadow-sm">
              <SteeringWheel size={22} weight="duotone" />
            </div>
            <div>
              <p className="caption-2 text-fg-muted">LogiFlow Courier</p>
              <h2 className="body-6 font-bold text-fg truncate max-w-[180px]">
                {profile?.licenseNumber
                  ? `License: ${profile.licenseNumber}`
                  : user?.userId
                  ? `Driver #${user.userId.slice(0, 8)}`
                  : 'Driver Console'}
              </h2>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => void logout()}
            className="text-fg-muted hover:text-fg gap-1"
          >
            <SignOut size={16} />
            <span className="text-xs">Exit</span>
          </Button>
        </div>

        {/* Profile Unregistered Guide */}
        {!profileLoading && (profileError || !profile) && (
          <div className="rounded-3xl border border-status-break/40 bg-status-break/10 p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-status-break">
              <Warning size={20} className="shrink-0" />
              <h3 className="body-6 font-bold">Driver License Onboarding Required</h3>
            </div>
            <p className="caption-1 text-fg-muted leading-relaxed">
              Your user account has been created, but your driver compliance profile has not yet been registered in the fleet management service.
            </p>
            <div className="rounded-2xl border border-surface-5 bg-surface-2 p-3 text-xs text-fg-muted space-y-1.5">
              <p className="font-medium text-fg">How to complete onboarding:</p>
              <p>1. Contact your LogiFlow organization administrator.</p>
              <p>2. Ask them to go to <strong>Settings &gt; Team Members</strong>.</p>
              <p>3. Find your name and click <strong>&quot;Onboard License&quot;</strong> to record and verify your driving credentials.</p>
              <p>4. Assign an operational fleet vehicle in the <strong>Fleet</strong> console.</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void refetchProfile()}
              className="self-start gap-1.5"
            >
              Refresh Profile Status
            </Button>
          </div>
        )}

        {/* Sticky Shift Status Banner */}
        <div className="rounded-3xl border border-surface-5 bg-surface-2 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="caption-2 font-semibold text-fg-muted uppercase tracking-wider">
              Shift Status
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  currentShift === 'AVAILABLE'
                    ? 'bg-status-available animate-pulse'
                    : currentShift === 'BUSY'
                    ? 'bg-status-busy animate-pulse'
                    : currentShift === 'ON_BREAK'
                    ? 'bg-status-break'
                    : 'bg-surface-5'
                }`}
              />
              <span className="caption-1 font-bold text-fg">
                {currentShift === 'AVAILABLE'
                  ? 'Online & Available'
                  : currentShift === 'BUSY'
                  ? 'On Active Delivery'
                  : currentShift === 'ON_BREAK'
                  ? 'On Break'
                  : 'Offline'}
              </span>
            </div>
          </div>

          {shiftError && (
            <div className="flex items-center gap-2 rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-xs text-status-urgent">
              <Warning size={16} className="shrink-0" />
              <span>{shiftError}</span>
            </div>
          )}

          {/* Tactile Shift Toggle Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={shiftMutation.isPending || !!activeJob || currentShift === 'BUSY' || !isEligibleToDrive}
              onClick={() => {
                if (!isEligibleToDrive) {
                  setShiftError(ineligibilityReason);
                  return;
                }
                shiftMutation.mutate('AVAILABLE');
              }}
              title={currentShift === 'BUSY' ? 'Complete active delivery first' : !isEligibleToDrive ? ineligibilityReason : 'Go available'}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all ${
                !isEligibleToDrive || currentShift === 'BUSY'
                  ? 'opacity-50 cursor-not-allowed border-surface-5 bg-surface-3 text-fg-muted'
                  : currentShift === 'AVAILABLE'
                  ? 'border-status-available bg-status-available/10 text-status-available font-bold shadow-sm'
                  : 'border-surface-5 bg-surface-3 text-fg-muted hover:text-fg'
              }`}
            >
              <Power size={18} weight="bold" />
              <span className="text-xs">Available</span>
            </button>

            <button
              type="button"
              disabled={shiftMutation.isPending || !!activeJob || currentShift === 'BUSY' || !profile}
              onClick={() => shiftMutation.mutate('ON_BREAK')}
              title={currentShift === 'BUSY' ? 'Complete active delivery first' : 'Go on break'}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all ${
                !profile || currentShift === 'BUSY'
                  ? 'opacity-50 cursor-not-allowed border-surface-5 bg-surface-3 text-fg-muted'
                  : currentShift === 'ON_BREAK'
                  ? 'border-status-break bg-status-break/10 text-status-break font-bold shadow-sm'
                  : 'border-surface-5 bg-surface-3 text-fg-muted hover:text-fg'
              }`}
            >
              <Coffee size={18} weight="bold" />
              <span className="text-xs">Break</span>
            </button>

            <button
              type="button"
              disabled={shiftMutation.isPending || !!activeJob || currentShift === 'BUSY' || !profile}
              onClick={() => shiftMutation.mutate('OFFLINE')}
              title={currentShift === 'BUSY' ? 'Complete active delivery first' : 'Go offline'}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center transition-all ${
                !profile || currentShift === 'BUSY'
                  ? 'opacity-50 cursor-not-allowed border-surface-5 bg-surface-3 text-fg-muted'
                  : currentShift === 'OFFLINE'
                  ? 'border-fg bg-surface-4 text-fg font-bold shadow-sm'
                  : 'border-surface-5 bg-surface-3 text-fg-muted hover:text-fg'
              }`}
            >
              <Power size={18} />
              <span className="text-xs">Offline</span>
            </button>
          </div>

          {!isEligibleToDrive && (
            <div className="flex items-start gap-2 rounded-2xl border border-status-break/30 bg-status-break/5 p-3 text-xs text-status-break">
              <Warning size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Compliance requirement needed:</p>
                <p className="text-fg-muted">{ineligibilityReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Job View (if currently delivering) */}
        {activeJob ? (
          <ActiveJobCard job={activeJob} onRefresh={refreshJob} onDropped={() => setActiveJob(null)} />
        ) : (
          /* Idle Views based on shift status */
          <div className="flex flex-col gap-4">
            {currentShift === 'AVAILABLE' && (
              <div className="rounded-3xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-available/10 text-status-available mb-3">
                  <Broadcast size={32} className="animate-pulse" />
                  <span className="absolute h-full w-full rounded-full border-2 border-status-available/30 animate-ping" />
                </div>
                <h3 className="heading-6 text-fg">Waiting for Orders</h3>
                <p className="caption-2 text-fg-muted mt-1 leading-relaxed">
                  Your GPS location is live and you are in the automated dispatch queue. When an order matches your route, a 45-second offer will pop up.
                </p>
              </div>
            )}

            {currentShift === 'BUSY' && (
              <div className="rounded-3xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-busy/10 text-status-busy mb-3">
                  <Broadcast size={32} className="animate-pulse" />
                  <span className="absolute h-full w-full rounded-full border-2 border-status-busy/30 animate-ping" />
                </div>
                <h3 className="heading-6 text-fg">Active Delivery in Progress</h3>
                <p className="caption-2 text-fg-muted mt-1 leading-relaxed">
                  Your delivery has been accepted. Syncing route and shipment details...
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    void refetchProfile();
                    const active = await driverApi.getActiveDelivery();
                    if (active?.shipmentId) {
                      const job = await driverApi.getJobView(active.shipmentId).catch(() => null);
                      if (job) setActiveJob(job);
                    }
                  }}
                  className="mt-4 gap-1.5"
                >
                  Sync Delivery
                </Button>
              </div>
            )}

            {currentShift === 'ON_BREAK' && (
              <div className="rounded-3xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
                <Coffee size={36} className="mx-auto text-status-break mb-3" />
                <h3 className="heading-6 text-fg">Shift Paused on Break</h3>
                <p className="caption-2 text-fg-muted mt-1">
                  You will not receive dispatch offers while on break. Switch to Available when ready to drive.
                </p>
              </div>
            )}

            {currentShift === 'OFFLINE' && (
              <div className="rounded-3xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
                <Power size={36} className="mx-auto text-fg-muted mb-3 opacity-60" />
                <h3 className="heading-6 text-fg">You are Offline</h3>
                <p className="caption-2 text-fg-muted mt-1">
                  Tap <strong>Available</strong> above to start your shift and begin receiving delivery jobs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Vehicle & Credentials Card */}
        {profile && (
          <div className="rounded-3xl border border-surface-5 bg-surface-2 p-4 shadow-sm flex flex-col gap-2.5">
            <span className="caption-2 font-semibold text-fg-muted uppercase tracking-wider">
              Vehicle & Compliance
            </span>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">Assigned Vehicle</span>
              <span className="font-mono font-bold text-fg">
                {profile.vehicle ? profile.vehicle.licensePlate : 'Pending assignment'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">License Compliance</span>
              <span
                className={`flex items-center gap-1 font-semibold ${
                  profile.licenseVerifiedAt ? 'text-status-available' : 'text-status-break'
                }`}
              >
                {profile.licenseVerifiedAt ? (
                  <>
                    <ShieldCheck size={14} />
                    Verified
                  </>
                ) : (
                  <>
                    <ShieldWarning size={14} />
                    Pending Verification
                  </>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 45-Second Countdown Incoming Offer Modal */}
      <IncomingOfferModal
        offer={activeOffer}
        onAccept={handleAcceptOffer}
        onReject={handleRejectOffer}
      />
    </div>
  );
}
