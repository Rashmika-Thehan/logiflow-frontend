import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, PaperPlaneTilt, UserPlus, Users, X, IdentificationBadge } from '@phosphor-icons/react';
import { invitationsApi, joinRequestsAdminApi, driversAdminApi } from '@/api/org.api';
import { usersApi } from '@/api/users.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/format';
import type { JoinRequest, UserRole, TeamMember } from '@/types';

const inviteSchema = z.object({
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  role: z.enum(['DISPATCHER', 'DRIVER']),
});
type InviteValues = z.infer<typeof inviteSchema>;

const roleBadge: Record<UserRole, { label: string; style: string }> = {
  BUSINESS_ADMIN: { label: 'Admin', style: 'border-status-break/40 bg-status-break/10 text-status-break' },
  DISPATCHER: { label: 'Dispatcher', style: 'border-status-available/40 bg-status-available/10 text-status-available' },
  DRIVER: { label: 'Driver', style: 'border-surface-5 bg-surface-3 text-fg' },
  SUPER_ADMIN: { label: 'Platform Admin', style: 'border-status-urgent/40 bg-status-urgent/10 text-status-urgent' },
};

export function TeamTab() {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [onboardingDriver, setOnboardingDriver] = useState<TeamMember | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<JoinRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Queries
  const { data: teammates = [], isPending: teammatesPending } = useQuery({
    queryKey: ['teammates'],
    queryFn: usersApi.list,
  });

  const { data: invitations = [], isPending: invitesPending } = useQuery({
    queryKey: ['invitations'],
    queryFn: invitationsApi.list,
  });

  const { data: joinRequests = [], isPending: _requestsPending } = useQuery({
    queryKey: ['join-requests-pending'],
    queryFn: () => joinRequestsAdminApi.list('PENDING'),
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['teammates'] });
    void queryClient.invalidateQueries({ queryKey: ['invitations'] });
    void queryClient.invalidateQueries({ queryKey: ['join-requests-pending'] });
  };

  // Mutations
  const revokeInviteMutation = useMutation({
    mutationFn: invitationsApi.revoke,
    onSuccess: () => {
      setNotice({ tone: 'ok', text: 'Invitation revoked.' });
      refreshAll();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to revoke invitation.') }),
  });

  const approveRequestMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role?: UserRole }) => joinRequestsAdminApi.approve(id, role),
    onSuccess: () => {
      setNotice({ tone: 'ok', text: 'Join request approved. Teammate added!' });
      refreshAll();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to approve request.') }),
  });

  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => joinRequestsAdminApi.reject(id, reason),
    onSuccess: () => {
      setRejectingRequest(null);
      setRejectReason('');
      setNotice({ tone: 'ok', text: 'Join request rejected.' });
      refreshAll();
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to reject request.') }),
  });

  return (
    <div className="flex flex-col gap-8">
      {notice && (
        <div
          role="status"
          className={`rounded-xl border p-3 body-6 ${
            notice.tone === 'ok'
              ? 'border-status-available/40 bg-status-available/10 text-status-available'
              : 'border-status-urgent/40 bg-status-urgent/10 text-status-urgent'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 1. Pending Join Requests Section (Only shown if pending exist) */}
      {joinRequests.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-status-break/40 bg-status-break/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="title-2 text-status-break">
                Pending Join Requests ({joinRequests.length})
              </h3>
              <p className="body-6 text-fg-muted">
                These drivers or dispatchers applied using your organization join code.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {joinRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-5 bg-surface-2 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="title-3">{req.fullName}</span>
                    <span className="caption-1 rounded-md border border-surface-5 bg-surface-3 px-2 py-0.5">
                      Requested: {req.requestedRole}
                    </span>
                  </div>
                  <p className="caption-1 text-fg-muted">
                    {req.email} • {req.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10 gap-1.5"
                    onClick={() => setRejectingRequest(req)}
                    disabled={rejectRequestMutation.isPending}
                  >
                    <X size={16} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveRequestMutation.mutate({ id: req.id, role: req.requestedRole })}
                    disabled={approveRequestMutation.isPending}
                    className="gap-1.5"
                  >
                    <Check size={16} />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Team Members Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="heading-5">Team Members</h2>
            <p className="body-6 text-fg-muted">
              Active administrators, dispatch control tower operators, and drivers in your fleet.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <UserPlus size={18} aria-hidden="true" />
            Invite Teammate
          </Button>
        </div>

        {teammatesPending ? (
          <div className="h-36 rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
        ) : teammates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-5 p-10 text-center">
            <Users size={32} className="text-fg-muted" />
            <p className="title-3">No teammates found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-5 bg-surface-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-5 bg-surface-3/50 caption-1 text-fg-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-5 body-6">
                  {teammates.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-fg">{m.fullName || '—'}</td>
                      <td className="px-4 py-3 text-fg-muted">{m.email || '—'}</td>
                      <td className="px-4 py-3 text-fg-muted">{m.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`caption-2 inline-flex items-center rounded-lg border px-2 py-0.5 font-medium ${roleBadge[m.role]?.style}`}>
                          {roleBadge[m.role]?.label || m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">
                        {m.createdAt ? formatDate(m.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.role === 'DRIVER' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setOnboardingDriver(m)}
                            className="gap-1.5"
                          >
                            <IdentificationBadge size={15} />
                            Onboard License
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pending Email Invitations Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="title-1">Active Email Invitations</h3>
          <p className="body-6 text-fg-muted">
            Pending invitations sent to prospective dispatchers and drivers.
          </p>
        </div>

        {invitesPending ? (
          <div className="h-24 rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
        ) : invitations.length === 0 ? (
          <p className="caption-1 text-fg-muted italic">No active pending invitations.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-5 bg-surface-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-5 bg-surface-3/50 caption-1 text-fg-muted">
                    <th className="px-4 py-3 font-medium">Invited Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-5 body-6">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-3/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-fg">{inv.email}</td>
                      <td className="px-4 py-3">
                        <span className={`caption-2 inline-flex items-center rounded-lg border px-2 py-0.5 font-medium ${roleBadge[inv.role]?.style}`}>
                          {roleBadge[inv.role]?.label || inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="caption-2 rounded-md border border-surface-5 bg-surface-3 px-2 py-0.5 text-fg-muted">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{formatDate(inv.expiresAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => revokeInviteMutation.mutate(inv.id)}
                            disabled={revokeInviteMutation.isPending}
                            className="caption-1 text-status-urgent hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invite Teammate Modal */}
      <InviteTeammateModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          setInviteOpen(false);
          setNotice({ tone: 'ok', text: 'Invitation sent via email!' });
          refreshAll();
        }}
      />

      {/* Onboard Driver Modal */}
      {onboardingDriver && (
        <OnboardDriverModal
          driver={onboardingDriver}
          onClose={() => setOnboardingDriver(null)}
          onSuccess={() => {
            const name = onboardingDriver.fullName || onboardingDriver.email;
            setOnboardingDriver(null);
            setNotice({
              tone: 'ok',
              text: `Driver "${name}" onboarded & license verified! Assign a vehicle in Fleet to activate.`,
            });
            refreshAll();
          }}
        />
      )}

      {/* Reject Join Request Modal */}
      <Modal
        open={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="Reject Join Request"
      >
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Are you sure you want to decline the join request from{' '}
            <strong className="text-fg">{rejectingRequest?.fullName}</strong> ({rejectingRequest?.email})?
          </p>

          <Field label="Reason (optional)">
            <Input
              placeholder="e.g. Current driver roster is full"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10"
              disabled={rejectRequestMutation.isPending}
              onClick={() =>
                rejectingRequest &&
                rejectRequestMutation.mutate({ id: rejectingRequest.id, reason: rejectReason.trim() || undefined })
              }
            >
              {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InviteTeammateModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'DRIVER' },
  });

  const onSubmit = async (values: InviteValues) => {
    setErrorMsg('');
    try {
      await invitationsApi.create(values);
      reset();
      onSuccess();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to send invitation.'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite Teammate">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {errorMsg && (
          <p role="alert" className="caption-2 text-status-urgent">
            {errorMsg}
          </p>
        )}

        <Field label="Email Address" error={errors.email?.message}>
          <Input type="email" placeholder="colleague@example.com" {...register('email')} />
        </Field>

        <Field label="Role" error={errors.role?.message}>
          <select
            className="w-full rounded-xl border border-surface-5 bg-surface-3 px-3 py-2 text-fg focus:outline-none focus:ring-1 focus:ring-surface-4"
            {...register('role')}
          >
            <option value="DRIVER">Driver</option>
            <option value="DISPATCHER">Dispatcher</option>
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <PaperPlaneTilt size={16} />
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const onboardSchema = z.object({
  licenseNumber: z.string().trim().min(3, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  emergencyContactName: z.string().trim().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().trim().min(5, 'Emergency contact phone is required'),
});
type OnboardValues = z.infer<typeof onboardSchema>;

function OnboardDriverModal({
  driver,
  onClose,
  onSuccess,
}: {
  driver: TeamMember;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      licenseNumber: '',
      licenseExpiry: '',
      emergencyContactName: '',
      emergencyContactPhone: driver.phone || '',
    },
  });

  const onSubmit = async (values: OnboardValues) => {
    setErrorMsg('');
    try {
      try {
        await driversAdminApi.onboard({
          userId: driver.id,
          licenseNumber: values.licenseNumber,
          licenseExpiry: values.licenseExpiry,
          emergencyContactName: values.emergencyContactName,
          emergencyContactPhone: values.emergencyContactPhone,
        });
      } catch (err: any) {
        if (err?.response?.status === 409 || err?.response?.data?.message?.includes('already')) {
          // Already created, proceed to verify
        } else {
          throw err;
        }
      }

      await driversAdminApi.verifyLicense(driver.id);
      onSuccess();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to complete driver onboarding'));
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Onboard Driver & Verify License">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {errorMsg && (
          <p role="alert" className="caption-2 text-status-urgent">
            {errorMsg}
          </p>
        )}

        <div className="rounded-xl border border-surface-5 bg-surface-3/50 p-3">
          <p className="caption-1 font-medium text-fg">{driver.fullName || 'Driver'}</p>
          <p className="caption-2 text-fg-muted">{driver.email}</p>
        </div>

        <Field label="Driver License Number" error={errors.licenseNumber?.message}>
          <Input placeholder="e.g. DL-9832049" {...register('licenseNumber')} />
        </Field>

        <Field label="License Expiry Date" error={errors.licenseExpiry?.message}>
          <Input type="date" {...register('licenseExpiry')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Emergency Contact Name" error={errors.emergencyContactName?.message}>
            <Input placeholder="e.g. Maria Silva" {...register('emergencyContactName')} />
          </Field>
          <Field label="Emergency Contact Phone" error={errors.emergencyContactPhone?.message}>
            <Input placeholder="e.g. +1 555-019-2834" {...register('emergencyContactPhone')} />
          </Field>
        </div>

        <p className="caption-2 text-fg-muted">
          Submitting this form creates the compliance profile in the fleet management service and verifies the driver&apos;s license credentials immediately.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <IdentificationBadge size={16} />
            {isSubmitting ? 'Onboarding...' : 'Onboard & Verify'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
