import { useState } from 'react';
import {
  Package,
  MapPin,
  Phone,
  NavigationArrow,
  Check,
  ShieldCheck,
  Warning,
  ArrowRight,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { DeliveryOtpModal } from './DeliveryOtpModal';
import { driverApi } from '@/api/driver.api';
import { getErrorMessage } from '@/api/client';
import type { DriverJobView } from '@/types';

interface Props {
  job: DriverJobView;
  onRefresh: () => void;
}

export function ActiveJobCard({ job, onRefresh }: Props) {
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const status = job.status;

  const handleAction = async (actionName: string, actionFn: () => Promise<unknown>) => {
    setLoadingAction(actionName);
    setActionError(null);
    try {
      await actionFn();
      onRefresh();
    } catch (err) {
      setActionError(getErrorMessage(err, `Action failed: ${actionName}`));
    } finally {
      setLoadingAction(null);
    }
  };

  const openNavigation = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const handleConfirmOtp = async (otp: string) => {
    await driverApi.confirmDelivery(job.id, otp);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-surface-5 bg-surface-2 p-5 shadow-md">
      {/* Active Job Header */}
      <div className="flex items-center justify-between border-b border-surface-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fg text-surface-0 shadow-sm">
            <Package size={22} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-fg text-sm">
                {job.trackingCode}
              </span>
              <span className="rounded-full border border-surface-5 bg-surface-3 px-2 py-0.2 text-[10px] font-bold uppercase text-fg-muted">
                {job.priority}
              </span>
            </div>
            <p className="caption-2 text-fg-muted mt-0.5">
              Weight: {job.weightKg} kg • Assigned Job
            </p>
          </div>
        </div>

        <span className="rounded-full border border-status-busy/40 bg-status-busy/10 px-2.5 py-1 text-xs font-semibold uppercase text-status-busy">
          {status}
        </span>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-xs text-status-urgent">
          <Warning size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Milestone Progression Steps */}

      {/* Phase A: Awaiting Depot Pickup */}
      {status === 'ASSIGNED' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-5 bg-surface-3/50 p-4">
          <div className="flex items-center gap-2 text-fg font-semibold caption-1">
            <MapPin size={18} className="text-status-break" />
            <span>Step 1: Depot Collection</span>
          </div>
          <p className="caption-2 text-fg-muted">
            Drive to your assigned logistics hub to collect this package before starting delivery.
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              disabled={loadingAction === 'arrived'}
              onClick={() => handleAction('arrived', () => driverApi.arrivedAtDepot(job.id))}
              className="flex-1 gap-1.5"
            >
              <Check size={16} />
              {loadingAction === 'arrived' ? 'Updating...' : 'I Have Arrived at Depot'}
            </Button>
          </div>
        </div>
      )}

      {/* Phase B: In Depot Loading */}
      {status === 'ASSIGNED' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-5 bg-surface-3/50 p-4">
          <p className="caption-2 text-fg-muted">
            Once cargo is verified and loaded into your vehicle:
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={loadingAction === 'collected'}
            onClick={() => handleAction('collected', () => driverApi.collectedParcel(job.id))}
            className="w-full gap-1.5"
          >
            <Package size={16} />
            {loadingAction === 'collected' ? 'Updating...' : 'Confirm Package Collected'}
          </Button>
        </div>
      )}

      {/* Phase C: Picked Up -> Ready to Start Route */}
      {status === 'PICKED_UP' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-surface-5 bg-surface-3/50 p-4">
          <div className="flex items-center gap-2 text-fg font-semibold caption-1">
            <NavigationArrow size={18} className="text-status-available" />
            <span>Step 2: Start Customer Transit</span>
          </div>
          <p className="caption-2 text-fg-muted">
            Package is on board. Tap below to begin transit. This will notify the recipient and reveal full delivery dropoff details.
          </p>

          <Button
            size="lg"
            disabled={loadingAction === 'start'}
            onClick={() => handleAction('start', () => driverApi.startDelivery(job.id))}
            className="w-full gap-2 font-bold shadow-md active:scale-[0.98]"
          >
            <ArrowRight size={18} weight="bold" />
            {loadingAction === 'start' ? 'Starting...' : 'Start Delivery Route'}
          </Button>
        </div>
      )}

      {/* Phase D: Out for Delivery (IN_TRANSIT) */}
      {status === 'IN_TRANSIT' && (
        <div className="flex flex-col gap-4">
          {/* Recipient Details (Released upon transit start) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-surface-5 bg-surface-3/50 p-4">
            <span className="caption-2 font-semibold text-fg-muted uppercase tracking-wider">
              Customer Destination
            </span>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="body-5 font-bold text-fg">
                  {job.recipientName || 'Customer Recipient'}
                </p>
                <p className="caption-1 text-fg mt-0.5 leading-relaxed">
                  {job.recipientAddress || 'Delivery Address Provided in Routing App'}
                </p>
              </div>

              {job.recipientPhone && (
                <a
                  href={`tel:${job.recipientPhone}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-available/10 text-status-available hover:bg-status-available/20 transition-colors"
                  title="Call Customer"
                >
                  <Phone size={18} weight="bold" />
                </a>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                openNavigation(job.approxDestLat, job.approxDestLng, job.recipientAddress)
              }
              className="w-full gap-2 mt-1"
            >
              <NavigationArrow size={16} />
              Open in Google Maps / Waze
            </Button>
          </div>

          {/* Verification Dropoff Completion */}
          <div className="flex flex-col gap-2 rounded-2xl border border-status-available/40 bg-status-available/10 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-status-available font-bold text-sm">
              <ShieldCheck size={20} weight="bold" />
              <span>Step 3: Milestone Verification</span>
            </div>
            <p className="caption-2 text-fg-muted">
              When at the recipient location, ask for their 4-digit security code to complete delivery.
            </p>

            <Button
              size="lg"
              onClick={() => setOtpModalOpen(true)}
              className="w-full gap-2 mt-2 bg-status-available text-surface-0 font-bold shadow-lg shadow-status-available/20 active:scale-[0.98]"
            >
              <Check size={18} weight="bold" />
              Verify & Complete Delivery
            </Button>
          </div>
        </div>
      )}

      {/* Phase E: Completed Delivered */}
      {status === 'DELIVERED' && (
        <div className="rounded-2xl border border-status-available/40 bg-status-available/10 p-5 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-status-available text-surface-0 mb-3">
            <Check size={24} weight="bold" />
          </div>
          <h4 className="heading-6 text-fg">Delivery Completed!</h4>
          <p className="caption-2 text-fg-muted mt-1">
            Parcel was successfully delivered and verified with customer OTP signature.
          </p>
        </div>
      )}

      {/* OTP Modal */}
      <DeliveryOtpModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onConfirm={handleConfirmOtp}
        recipientName={job.recipientName}
      />
    </div>
  );
}
