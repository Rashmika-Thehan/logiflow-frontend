import { Check, Package, Truck, CheckCircle, Clock } from '@phosphor-icons/react';
import { statusDescription, statusLabel } from '@/lib/shipment';
import type { ShipmentStatus } from '@/types';

interface Props {
  status: string;
}

interface StepDef {
  key: string;
  title: string;
  description: string;
  icon: typeof Package;
}

const STEPS: StepDef[] = [
  {
    key: 'placed',
    title: 'Order Placed',
    description: 'Shipment recorded & awaiting dispatch',
    icon: Package,
  },
  {
    key: 'picked_up',
    title: 'Dispatched',
    description: 'Driver picked up parcel at depot',
    icon: Clock,
  },
  {
    key: 'in_transit',
    title: 'Out for Delivery',
    description: 'Driver is on route to your location',
    icon: Truck,
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Package delivered & verified',
    icon: CheckCircle,
  },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'PENDING':
    case 'DISPATCHING':
    case 'ASSIGNED':
      return 0;
    case 'PICKED_UP':
      return 1;
    case 'IN_TRANSIT':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return 0;
  }
}

export function TrackingStepper({ status }: Props) {
  const isCancelled = status === 'CANCELLED';
  const isFailed = status === 'FAILED';
  const activeIndex = getStepIndex(status);

  if (isCancelled || isFailed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-status-urgent/40 bg-status-urgent/10 p-4 text-status-urgent">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-urgent/20 text-status-urgent">
          !
        </span>
        <div>
          <h4 className="body-5 font-semibold">
            {isCancelled ? 'Shipment Cancelled' : 'Delivery Attempt Failed'}
          </h4>
          <p className="caption-2 mt-0.5">{statusDescription(status as 'CANCELLED' | 'FAILED')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {statusDescription(status as ShipmentStatus) && (
        <p className="caption-1 text-fg-muted" role="status">
          <span className="font-semibold text-fg">{statusLabel(status as ShipmentStatus)}:</span>{' '}
          {statusDescription(status as ShipmentStatus)}
        </p>
      )}
      <div className="relative flex items-center justify-between">
        {/* Progress connecting line */}
        <div className="absolute left-6 right-6 top-5 -z-0 h-0.5 bg-surface-4">
          <div
            className="h-full bg-fg transition-all duration-500 ease-brand"
            style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="z-10 flex flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isDone
                    ? 'border-fg bg-fg text-surface-0'
                    : isCurrent
                    ? 'border-fg bg-surface-1 text-fg shadow-md ring-4 ring-fg/10'
                    : 'border-surface-5 bg-surface-3 text-fg-muted'
                }`}
              >
                {isDone ? <Check size={18} weight="bold" /> : <Icon size={18} />}
              </div>

              <div className="mt-2.5 max-w-[90px] sm:max-w-[120px]">
                <p
                  className={`caption-1 font-semibold ${
                    isCurrent ? 'text-fg font-bold' : isDone ? 'text-fg' : 'text-fg-muted'
                  }`}
                >
                  {step.title}
                </p>
                <p className="caption-2 text-fg-muted hidden sm:block mt-0.5 line-clamp-2">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
