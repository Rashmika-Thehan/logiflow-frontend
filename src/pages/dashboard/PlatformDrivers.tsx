import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IdentificationBadge,
  ShieldCheck,
  ShieldWarning,
  Check,
  X,
  Warning,
  MagnifyingGlass,
  ArrowClockwise,
  Truck,
  Eye,
  Prohibit,
  UserCheck,
} from '@phosphor-icons/react';
import { platformDriversApi } from '@/api/platform-drivers.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/format';
import { vehicleClassLabel } from '@/lib/vehicle';
import type { PlatformDriverItem, ShiftStatus } from '@/types';

type FilterTab = 'all' | 'needs-review' | 'verified' | 'available';

const shiftBadge: Record<ShiftStatus, { label: string; dot: string; style: string }> = {
  AVAILABLE: {
    label: 'Available',
    dot: 'bg-status-available',
    style: 'border-status-available/30 bg-status-available/10 text-status-available',
  },
  OFFLINE: {
    label: 'Offline',
    dot: 'bg-surface-5',
    style: 'border-surface-5 bg-surface-3 text-fg-muted',
  },
  ON_BREAK: {
    label: 'On Break',
    dot: 'bg-status-break',
    style: 'border-status-break/30 bg-status-break/10 text-status-break',
  },
  BUSY: {
    label: 'On Delivery',
    dot: 'bg-status-busy',
    style: 'border-status-busy/30 bg-status-busy/10 text-status-busy',
  },
};

export default function PlatformDrivers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [verifyingDriver, setVerifyingDriver] = useState<PlatformDriverItem | null>(null);
  const [revokingDriver, setRevokingDriver] = useState<PlatformDriverItem | null>(null);
  const [inspectingDriver, setInspectingDriver] = useState<PlatformDriverItem | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Queries
  const {
    data: drivers = [],
    isPending,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['platform-drivers'],
    queryFn: () => platformDriversApi.listMerged(),
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (id: string) => platformDriversApi.verifyLicense(id),
    onSuccess: (updated) => {
      setVerifyingDriver(null);
      setActionNotice({ tone: 'ok', text: `License ${updated.licenseNumber} verified successfully.` });
      void queryClient.invalidateQueries({ queryKey: ['platform-drivers'] });
    },
    onError: (err) => {
      setActionNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to verify driver license.') });
    },
  });

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => platformDriversApi.revokeVerification(id),
    onSuccess: () => {
      setRevokingDriver(null);
      setActionNotice({ tone: 'ok', text: 'Driver license verification revoked. Driver shifted offline.' });
      void queryClient.invalidateQueries({ queryKey: ['platform-drivers'] });
    },
    onError: (err) => {
      setActionNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to revoke verification.') });
    },
  });

  // Metrics
  const stats = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter((d) => d.shiftStatus === 'AVAILABLE' && d.eligible).length;
    const needsReview = drivers.filter((d) => !d.licenseVerifiedAt || !d.eligible).length;
    const verified = drivers.filter((d) => Boolean(d.licenseVerifiedAt)).length;
    return { total, available, needsReview, verified };
  }, [drivers]);

  // Filtered drivers list
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      // Tab filter
      if (activeTab === 'needs-review' && d.licenseVerifiedAt && d.eligible) return false;
      if (activeTab === 'verified' && !d.licenseVerifiedAt) return false;
      if (activeTab === 'available' && d.shiftStatus !== 'AVAILABLE') return false;

      // Text query
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = d.user?.fullName?.toLowerCase() || '';
        const email = d.user?.email?.toLowerCase() || '';
        const phone = d.user?.phone?.toLowerCase() || '';
        const license = d.licenseNumber.toLowerCase();
        const plate = d.vehicle?.licensePlate.toLowerCase() || '';
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          license.includes(q) ||
          plate.includes(q)
        );
      }
      return true;
    });
  }, [drivers, activeTab, search]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-4">Platform Driver Fleet</h1>
            <span className="rounded-full border border-status-urgent/40 bg-status-urgent/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-status-urgent">
              Super Admin
            </span>
          </div>
          <p className="body-5 text-fg-muted mt-1">
            Review credentials, verify commercial licenses, and oversee the independent platform driver marketplace.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void refetch()}
          disabled={isRefetching}
          className="gap-2"
        >
          <ArrowClockwise size={16} className={isRefetching ? 'animate-spin' : ''} />
          Refresh Pool
        </Button>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            actionNotice.tone === 'ok'
              ? 'border-status-available/40 bg-status-available/10 text-status-available'
              : 'border-status-urgent/40 bg-status-urgent/10 text-status-urgent'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.tone === 'ok' ? <Check size={18} /> : <Warning size={18} />}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-fg-muted hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="caption-1 text-fg-muted">Total Platform Pool</span>
            <IdentificationBadge size={22} className="text-fg-muted" />
          </div>
          <p className="heading-4 mt-2">{stats.total}</p>
          <p className="caption-2 text-fg-muted mt-1">Registered freelance drivers</p>
        </div>

        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="caption-1 text-fg-muted">Ready for Dispatch</span>
            <div className="h-3 w-3 rounded-full bg-status-available animate-pulse" />
          </div>
          <p className="heading-4 mt-2 text-status-available">{stats.available}</p>
          <p className="caption-2 text-fg-muted mt-1">Eligible & active on shift</p>
        </div>

        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="caption-1 text-fg-muted">Pending Review / Blocked</span>
            <ShieldWarning size={22} className="text-status-break" />
          </div>
          <p className="heading-4 mt-2 text-status-break">{stats.needsReview}</p>
          <p className="caption-2 text-fg-muted mt-1">Needs verification or vehicle renewal</p>
        </div>

        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-5">
          <div className="flex items-center justify-between">
            <span className="caption-1 text-fg-muted">Verified Drivers</span>
            <ShieldCheck size={22} className="text-status-available" />
          </div>
          <p className="heading-4 mt-2">{stats.verified}</p>
          <p className="caption-2 text-fg-muted mt-1">
            {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}% compliance rate` : 'No drivers'}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-5 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-fg text-surface-0'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`}
            >
              All Drivers ({drivers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('needs-review')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'needs-review'
                  ? 'bg-fg text-surface-0'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`}
            >
              <span>Needs Review</span>
              {stats.needsReview > 0 && (
                <span className="rounded-full bg-status-break/20 text-status-break px-1.5 py-0.2 text-[10px] font-bold">
                  {stats.needsReview}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('verified')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'verified'
                  ? 'bg-fg text-surface-0'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`}
            >
              Verified ({stats.verified})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'available'
                  ? 'bg-fg text-surface-0'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`}
            >
              Available Now ({stats.available})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Input
              placeholder="Search by name, email, license, plate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
            <MagnifyingGlass size={16} className="absolute left-3 top-2.5 text-fg-muted" />
          </div>
        </div>

        {/* Drivers Table */}
        <div className="overflow-hidden rounded-2xl border border-surface-5 bg-surface-2 shadow-sm">
          {isPending ? (
            <div className="p-12 text-center text-fg-muted caption-1">
              Loading platform driver records...
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="p-12 text-center">
              <IdentificationBadge size={36} className="mx-auto text-fg-muted mb-2 opacity-50" />
              <p className="body-5 font-medium">No platform drivers found</p>
              <p className="caption-2 text-fg-muted mt-1">
                {search
                  ? 'Try adjusting your search query.'
                  : 'Platform drivers who sign up through the driver portal will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-5 bg-surface-3/50 text-xs font-medium text-fg-muted">
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4">License Compliance</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Dispatch Eligibility</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-4 body-6">
                  {filteredDrivers.map((driver) => {
                    const shift = shiftBadge[driver.shiftStatus] || shiftBadge.OFFLINE;
                    const isVerified = Boolean(driver.licenseVerifiedAt);
                    const licenseExpired = new Date(driver.licenseExpiry) <= new Date();
                    const daysUntilExpiry = Math.ceil(
                      (new Date(driver.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                    );

                    return (
                      <tr key={driver.driverId} className="hover:bg-surface-3/40 transition-colors">
                        {/* Driver Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-4 font-semibold text-fg">
                              {driver.user?.fullName
                                ? driver.user.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()
                                : 'DR'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-fg truncate">
                                {driver.user?.fullName ?? `Driver #${driver.driverId.slice(0, 8)}`}
                              </p>
                              <p className="caption-2 text-fg-muted truncate">
                                {driver.user?.email ?? 'No email provided'}
                              </p>
                              {driver.user?.phone && (
                                <p className="caption-2 text-fg-muted">{driver.user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Shift Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${shift.style}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${shift.dot}`} />
                            {shift.label}
                          </span>
                        </td>

                        {/* License Compliance */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-fg">
                                {driver.licenseNumber}
                              </span>
                              {licenseExpired ? (
                                <span className="rounded-full border border-status-urgent/40 bg-status-urgent/10 px-1.5 py-0.2 text-[10px] font-semibold text-status-urgent uppercase">
                                  Expired
                                </span>
                              ) : daysUntilExpiry <= 30 ? (
                                <span className="rounded-full border border-status-break/40 bg-status-break/10 px-1.5 py-0.2 text-[10px] font-semibold text-status-break uppercase">
                                  Expiring in {daysUntilExpiry}d
                                </span>
                              ) : (
                                <span className="rounded-full border border-status-available/40 bg-status-available/10 px-1.5 py-0.2 text-[10px] font-semibold text-status-available uppercase">
                                  Valid
                                </span>
                              )}
                            </div>
                            <span className="caption-2 text-fg-muted">
                              Expires: {formatDate(driver.licenseExpiry)}
                            </span>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {driver.vehicle ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-4 text-fg-muted">
                                <Truck size={16} />
                              </div>
                              <div>
                                <p className="font-mono text-xs font-semibold text-fg">
                                  {driver.vehicle.licensePlate}
                                </p>
                                <p className="caption-2 text-fg-muted">
                                  {vehicleClassLabel(driver.vehicle.vehicleClass)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="caption-2 text-fg-muted italic">No vehicle assigned</span>
                          )}
                        </td>

                        {/* Dispatch Eligibility & Verification */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-available">
                                <ShieldCheck size={16} />
                                Verified ({driver.licenseVerifiedAt ? formatDate(driver.licenseVerifiedAt) : 'Yes'})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-break">
                                <ShieldWarning size={16} />
                                Unverified License
                              </span>
                            )}

                            {!driver.eligible && driver.blocker && (
                              <span className="caption-2 text-status-urgent font-medium">
                                ⚠ {driver.blocker}
                              </span>
                            )}

                            {driver.eligible && (
                              <span className="caption-2 text-fg-muted">
                                Dispatch eligible ✓
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectingDriver(driver)}
                              title="View driver profile and telemetry"
                            >
                              <Eye size={16} />
                            </Button>

                            {!isVerified ? (
                              <Button
                                size="sm"
                                disabled={licenseExpired || verifyMutation.isPending}
                                onClick={() => setVerifyingDriver(driver)}
                                className="gap-1.5"
                              >
                                <UserCheck size={16} />
                                Verify
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10 gap-1.5"
                                disabled={revokeMutation.isPending}
                                onClick={() => setRevokingDriver(driver)}
                              >
                                <Prohibit size={16} />
                                Revoke
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Verify License Confirmation Modal */}
      <Modal
        open={!!verifyingDriver}
        onClose={() => setVerifyingDriver(null)}
        title="Verify Driver Commercial License"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            You are verifying the commercial license credentials for{' '}
            <strong className="text-fg">{verifyingDriver?.user?.fullName ?? verifyingDriver?.driverId}</strong>.
          </p>

          <div className="rounded-xl border border-surface-5 bg-surface-3 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-fg-muted">License Number</span>
              <span className="font-mono font-bold text-fg">{verifyingDriver?.licenseNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-fg-muted">Expiration Date</span>
              <span className="font-mono text-fg">{formatDate(verifyingDriver?.licenseExpiry)}</span>
            </div>
            {verifyingDriver?.vehicle && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-fg-muted">Assigned Vehicle</span>
                <span className="font-mono text-fg">{verifyingDriver.vehicle.licensePlate} ({verifyingDriver.vehicle.vehicleClass})</span>
              </div>
            )}
          </div>

          <p className="caption-1 text-fg-muted">
            Once verified, this driver will become eligible to receive automated platform dispatch offers when businesses request freelance capacity.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setVerifyingDriver(null)}>
              Cancel
            </Button>
            <Button
              disabled={verifyMutation.isPending}
              onClick={() => verifyingDriver && verifyMutation.mutate(verifyingDriver.driverId)}
              className="gap-1.5"
            >
              <Check size={16} />
              {verifyMutation.isPending ? 'Verifying...' : 'Confirm Verification'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke Verification Confirmation Modal */}
      <Modal
        open={!!revokingDriver}
        onClose={() => setRevokingDriver(null)}
        title="Revoke License Verification"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Are you sure you want to revoke the license verification for{' '}
            <strong className="text-fg">{revokingDriver?.user?.fullName ?? revokingDriver?.driverId}</strong>?
          </p>

          <div className="rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-xs text-status-urgent">
            ⚠ Warning: Revoking verification will immediately remove this driver from the dispatch pool and force their shift status to <strong>OFFLINE</strong>.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRevokingDriver(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10"
              disabled={revokeMutation.isPending}
              onClick={() => revokingDriver && revokeMutation.mutate(revokingDriver.driverId)}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Verification'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Driver Details Modal */}
      <Modal
        open={!!inspectingDriver}
        onClose={() => setInspectingDriver(null)}
        title={`Driver Details: ${inspectingDriver?.user?.fullName ?? inspectingDriver?.driverId ?? ''}`}
      >
        {inspectingDriver && (
          <div className="flex flex-col gap-5">
            {/* Identity Info */}
            <div>
              <h4 className="caption-1 font-semibold text-fg-muted uppercase tracking-wider mb-2">
                Identity & Contact
              </h4>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-surface-5 bg-surface-3 p-3 text-xs">
                <div>
                  <span className="text-fg-muted block">Full Name</span>
                  <span className="font-medium text-fg">{inspectingDriver.user?.fullName ?? 'Not registered'}</span>
                </div>
                <div>
                  <span className="text-fg-muted block">Email</span>
                  <span className="font-medium text-fg">{inspectingDriver.user?.email ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-fg-muted block">Phone</span>
                  <span className="font-medium text-fg">{inspectingDriver.user?.phone ?? 'N/A'}</span>
                </div>
                <div>
                  <span className="text-fg-muted block">Registered On</span>
                  <span className="font-medium text-fg">{formatDate(inspectingDriver.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* License & Compliance */}
            <div>
              <h4 className="caption-1 font-semibold text-fg-muted uppercase tracking-wider mb-2">
                License & Credentials
              </h4>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-surface-5 bg-surface-3 p-3 text-xs">
                <div>
                  <span className="text-fg-muted block">License Number</span>
                  <span className="font-mono font-medium text-fg">{inspectingDriver.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-fg-muted block">License Expiry</span>
                  <span className="font-medium text-fg">{formatDate(inspectingDriver.licenseExpiry)}</span>
                </div>
                <div>
                  <span className="text-fg-muted block">Verification Status</span>
                  <span className={`font-medium ${inspectingDriver.licenseVerifiedAt ? 'text-status-available' : 'text-status-break'}`}>
                    {inspectingDriver.licenseVerifiedAt
                      ? `Verified (${formatDate(inspectingDriver.licenseVerifiedAt)})`
                      : 'Unverified'}
                  </span>
                </div>
                <div>
                  <span className="text-fg-muted block">Shift Status</span>
                  <span className="font-medium text-fg">{inspectingDriver.shiftStatus}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <h4 className="caption-1 font-semibold text-fg-muted uppercase tracking-wider mb-2">
                Assigned Vehicle
              </h4>
              {inspectingDriver.vehicle ? (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-surface-5 bg-surface-3 p-3 text-xs">
                  <div>
                    <span className="text-fg-muted block">License Plate</span>
                    <span className="font-mono font-bold text-fg">{inspectingDriver.vehicle.licensePlate}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted block">Vehicle Class</span>
                    <span className="font-medium text-fg">{vehicleClassLabel(inspectingDriver.vehicle.vehicleClass)}</span>
                  </div>
                  <div>
                    <span className="text-fg-muted block">Insurance Expiration</span>
                    <span className="font-medium text-fg">
                      {inspectingDriver.vehicle.insuranceExpiry ? formatDate(inspectingDriver.vehicle.insuranceExpiry) : 'None on file'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-surface-5 bg-surface-3 p-3 text-xs text-fg-muted italic">
                  No vehicle currently assigned to this driver.
                </div>
              )}
            </div>

            {/* Eligibility Blocker Note */}
            {!inspectingDriver.eligible && inspectingDriver.blocker && (
              <div className="rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-xs text-status-urgent flex items-center gap-2">
                <Warning size={16} className="shrink-0" />
                <span><strong>Dispatch Blocker:</strong> {inspectingDriver.blocker}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setInspectingDriver(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
