import { useEffect, useState } from 'react';
import { Package, Clock, Check, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { playAlertTone } from '@/lib/audio';
import type { AssignmentOffer } from '@/types';

interface Props {
  offer: AssignmentOffer | null;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  isSubmitting?: boolean;
}

const TOTAL_SECONDS = 45;

export function IncomingOfferModal({ offer, onAccept, onReject, isSubmitting = false }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (!offer) {
      setSecondsLeft(TOTAL_SECONDS);
      return;
    }

    // Play dispatch alert chime
    playAlertTone();

    // Calculate actual seconds remaining based on respondBy timestamp
    const deadline = new Date(offer.respondBy).getTime();
    const updateTime = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining > 0 ? Math.min(remaining, TOTAL_SECONDS) : 0);
      if (remaining <= 0) {
        onReject(offer.id);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [offer, onReject]);

  if (!offer) return null;

  const percent = Math.max(0, Math.min(100, (secondsLeft / TOTAL_SECONDS) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-surface-5 bg-surface-1 shadow-2xl">
        {/* Countdown Progress Bar Header */}
        <div className="relative h-2 w-full bg-surface-4">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              secondsLeft > 15
                ? 'bg-status-available'
                : secondsLeft > 7
                ? 'bg-status-break'
                : 'bg-status-urgent'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header Title with Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-status-available animate-ping" />
              <h3 className="heading-5 font-bold text-fg">New Delivery Offer</h3>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-surface-5 bg-surface-3 px-3 py-1 font-mono text-xs font-bold text-fg">
              <Clock size={15} />
              <span>{secondsLeft}s</span>
            </div>
          </div>

          <p className="caption-1 text-fg-muted mt-1">
            Accept assignment within the countdown window to claim this delivery.
          </p>

          {/* Job Details Preview Card */}
          <div className="my-5 rounded-2xl border border-surface-5 bg-surface-2 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-4 text-fg">
                  <Package size={20} />
                </div>
                <div>
                  <p className="body-6 font-semibold text-fg">Standard Parcel</p>
                  <p className="caption-2 text-fg-muted">Shipment #{offer.shipmentId.slice(0, 8)}</p>
                </div>
              </div>

              {offer.preview?.priority && (
                <span className="rounded-full border border-surface-5 bg-surface-3 px-2.5 py-0.5 text-xs font-semibold uppercase text-fg">
                  {offer.preview.priority}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-4 text-xs">
              <div>
                <span className="text-fg-muted block">Cargo Weight</span>
                <span className="font-semibold text-fg">
                  {offer.preview?.weightKg ? `${offer.preview.weightKg} kg` : 'Standard load'}
                </span>
              </div>
              <div>
                <span className="text-fg-muted block">Estimated Distance</span>
                <span className="font-semibold text-fg">
                  {offer.preview?.approxDistanceKm
                    ? `~${offer.preview.approxDistanceKm} km`
                    : 'Local zone delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isSubmitting}
              onClick={() => onReject(offer.id)}
              className="flex-1 gap-2"
            >
              <X size={18} />
              Decline
            </Button>

            <Button
              type="button"
              size="lg"
              disabled={isSubmitting}
              onClick={() => onAccept(offer.id)}
              className="flex-1 gap-2 bg-fg text-surface-0 font-bold shadow-lg shadow-fg/20 active:scale-[0.98]"
            >
              <Check size={18} weight="bold" />
              {isSubmitting ? 'Claiming...' : 'Accept Job'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
