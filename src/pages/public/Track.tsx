import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  Copy,
  Check,
  Clock,
  Package,
  ShieldCheck,
  Warning,
  Broadcast,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { usePublicTracking } from '@/hooks/usePublicTracking';
import { TrackingMap } from '@/components/map/TrackingMap';
import { TrackingStepper } from '@/components/tracking/TrackingStepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';

const RECENT_KEY = 'logiflow.recentTrackingCodes';

function getRecentCodes(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentCode(code: string) {
  try {
    const current = getRecentCodes();
    const filtered = [code, ...current.filter((c) => c !== code)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered));
  } catch {
    // storage disabled or quota exceeded
  }
}

export default function Track() {
  const { trackingCode: urlCode } = useParams<{ trackingCode?: string }>();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState(urlCode || '');
  const [copied, setCopied] = useState(false);
  const [recentCodes, setRecentCodes] = useState<string[]>([]);

  useEffect(() => {
    setRecentCodes(getRecentCodes());
  }, []);

  useEffect(() => {
    if (urlCode) {
      setInputCode(urlCode);
      saveRecentCode(urlCode.toUpperCase());
      setRecentCodes(getRecentCodes());
    }
  }, [urlCode]);

  const {
    shipment,
    driverPos,
    destPos,
    etaMinutes,
    isLive,
    isPending,
    error,
    refetch,
  } = usePublicTracking(urlCode);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/track/${encodeURIComponent(clean)}`);
  };

  const handleCopy = () => {
    if (!urlCode) return;
    void navigator.clipboard.writeText(urlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Banner */}
      <div className="flex flex-col gap-6 text-center">
        <div>
          <h1 className="heading-3">Real-time Parcel Tracking</h1>
          <p className="body-5 text-fg-muted mt-2">
            Follow your delivery live from depot departure to your doorstep.
          </p>
        </div>

        {/* Tracking Search Input Form */}
        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-surface-5 bg-surface-2 p-1.5 shadow-md focus-within:border-fg transition-colors"
        >
          <div className="relative flex-1">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. LF-A1B2C3D4E5F6"
              className="border-none bg-transparent pl-10 uppercase tracking-wider font-mono text-sm focus:ring-0 focus-visible:border-transparent"
            />
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-2.5 text-fg-muted"
            />
          </div>
          <Button type="submit" size="sm" className="px-5 shrink-0">
            Track
          </Button>
        </form>

        {/* Recent Searches */}
        {!urlCode && recentCodes.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-fg-muted">
            <span>Recent lookups:</span>
            {recentCodes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => navigate(`/track/${c}`)}
                className="rounded-lg border border-surface-5 bg-surface-3 px-2 py-1 font-mono hover:bg-surface-4 hover:text-fg transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {/* State 1: No tracking code entered */}
        {!urlCode && (
          <div className="mx-auto max-w-md rounded-2xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
            <Package size={44} className="mx-auto text-fg-muted opacity-60 mb-3" />
            <h3 className="heading-6">Track your parcel</h3>
            <p className="caption-1 text-fg-muted mt-2 leading-relaxed">
              Enter your LogiFlow tracking reference above to view live courier telemetry, current progress, and estimated delivery window.
            </p>
          </div>
        )}

        {/* State 2: Loading */}
        {urlCode && isPending && !shipment && (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg border-t-transparent" />
            <p className="body-6 text-fg-muted">Connecting to tracking service...</p>
          </div>
        )}

        {/* State 3: Error */}
        {urlCode && error && !shipment && (
          <div className="mx-auto max-w-md rounded-2xl border border-status-urgent/40 bg-surface-2 p-6 text-center">
            <Warning size={40} className="mx-auto text-status-urgent mb-3" />
            <h3 className="heading-6">Tracking Reference Not Found</h3>
            <p className="caption-1 text-fg-muted mt-2">
              We couldn't locate parcel <strong className="font-mono text-fg">{urlCode}</strong>.
              Please double check the code from your confirmation SMS or dispatch email.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/track')}>
                Try another code
              </Button>
            </div>
          </div>
        )}

        {/* State 4: Active Tracking Info & Live Map */}
        {shipment && (
          <div className="flex flex-col gap-6">
            {/* Tracking Status Card */}
            <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-5 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="caption-2 text-fg-muted">Tracking Code:</span>
                    <span className="font-mono font-bold text-fg text-base sm:text-lg">
                      {shipment.trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded p-1 text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
                      title="Copy tracking code"
                    >
                      {copied ? <Check size={16} className="text-status-available" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="rounded-full border border-surface-5 bg-surface-3 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-fg-muted">
                      {shipment.priority} Priority
                    </span>
                    {shipment.createdAt && (
                      <span className="caption-2 text-fg-muted">
                        Dispatched {formatDateTime(shipment.createdAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Status Pill & ETA */}
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isLive ? 'bg-status-available animate-pulse' : 'bg-surface-5'
                      }`}
                    />
                    <span className="caption-1 font-semibold text-fg">
                      {isLive ? 'Live Satellite Link' : 'Standard Feed'}
                    </span>
                  </div>

                  {etaMinutes !== null && etaMinutes > 0 && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-status-available/40 bg-status-available/10 px-3 py-1 text-xs font-semibold text-status-available">
                      <Clock size={16} weight="bold" />
                      <span>Estimated arrival in ~{etaMinutes} min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="pt-6 pb-2">
                <TrackingStepper status={shipment.status} />
              </div>
            </div>

            {/* Map & Delivery Details Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left 2 Cols: Interactive Map */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <div className="h-[380px] sm:h-[460px] w-full overflow-hidden rounded-2xl border border-surface-5 shadow-sm">
                  <TrackingMap destPos={destPos} driverPos={driverPos} />
                </div>
                <div className="flex items-center justify-between px-2 text-xs text-fg-muted">
                  <div className="flex items-center gap-1.5">
                    <Broadcast size={14} className={isLive ? 'text-status-available' : ''} />
                    <span>{isLive ? 'Socket connection active' : 'Polling for driver updates'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="flex items-center gap-1 hover:text-fg transition-colors"
                  >
                    <ArrowClockwise size={13} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Right Col: Delivery Notice & Security Verification */}
              <div className="flex flex-col gap-4">
                {/* Security Verification Notice */}
                <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 text-fg">
                    <ShieldCheck size={22} className="text-status-available" />
                    <h4 className="body-5 font-semibold">Delivery Security</h4>
                  </div>
                  <p className="caption-1 text-fg-muted mt-2 leading-relaxed">
                    For your parcel safety, our courier requires a <strong>4-digit OTP verification code</strong> to complete delivery.
                  </p>
                  <div className="mt-3 rounded-xl border border-surface-5 bg-surface-3/60 p-3 text-xs text-fg-muted">
                    Your verification code was sent to the recipient phone number & email on file. Have it ready when the driver arrives.
                  </div>
                </div>

                {/* Delivery Window Summary */}
                <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5 shadow-sm">
                  <h4 className="body-5 font-semibold text-fg">Expected Schedule</h4>
                  <div className="mt-3 flex flex-col gap-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-surface-4">
                      <span className="text-fg-muted">Window Start</span>
                      <span className="font-medium text-fg">
                        {formatDateTime(shipment.deliveryWindowStart)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-fg-muted">Window End</span>
                      <span className="font-medium text-fg">
                        {formatDateTime(shipment.deliveryWindowEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Help & Support */}
                <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5 shadow-sm">
                  <h4 className="body-5 font-semibold text-fg">Need Assistance?</h4>
                  <p className="caption-2 text-fg-muted mt-1 leading-relaxed">
                    Have questions about your delivery address or timing? Contact the merchant or dispatch team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
