import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, CheckCircle, Warning, GoogleLogo } from '@phosphor-icons/react';
import { usersApi } from '@/api/users.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ProfileTab() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getProfile,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileNotice, setProfileNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: () => usersApi.updateProfile({ fullName, phone }),
    onSuccess: () => {
      setProfileNotice({ tone: 'ok', text: 'Profile details saved successfully.' });
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err) => {
      setProfileNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to update profile.') });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match.');
      }
      return usersApi.changePassword({
        currentPassword: profile?.hasPassword ? currentPassword : undefined,
        newPassword,
      });
    },
    onSuccess: (res) => {
      setPasswordNotice({ tone: 'ok', text: res.message || 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: any) => {
      setPasswordNotice({ tone: 'error', text: getErrorMessage(err, err?.message ?? 'Failed to update password.') });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-fg-muted caption-1">Loading profile...</div>;
  }

  if (isError || !profile) {
    return (
      <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6 text-fg">
        <p className="title-3">Could not load profile details</p>
        <p className="body-6 text-fg-muted mt-1">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* 1. Profile Information */}
      <div className="flex flex-col gap-5 rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-surface-5 pb-4">
          <User size={20} className="text-fg-muted" />
          <h3 className="title-3 text-fg">Profile Information</h3>
        </div>

        {profileNotice && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
              profileNotice.tone === 'ok'
                ? 'border border-status-available/30 bg-status-available/10 text-status-available'
                : 'border border-status-urgent/30 bg-status-urgent/10 text-status-urgent'
            }`}
          >
            {profileNotice.tone === 'ok' ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{profileNotice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg-muted font-medium">Email Address</label>
            <div className="flex items-center gap-2">
              <Input value={profile.email} disabled className="opacity-70 bg-surface-3" />
              {profile.isGoogleUser && (
                <span
                  title="Signed in via Google"
                  className="flex items-center gap-1 rounded-lg border border-surface-5 bg-surface-3 px-2.5 py-1.5 text-xs text-fg-muted"
                >
                  <GoogleLogo size={14} weight="bold" />
                  Google
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg-muted font-medium">Organization Role</label>
            <Input value={profile.role} disabled className="opacity-70 bg-surface-3 uppercase font-mono text-xs" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg font-medium">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg font-medium">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +94771234567"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            disabled={profileMutation.isPending}
            onClick={() => profileMutation.mutate()}
          >
            {profileMutation.isPending ? 'Saving...' : 'Save Profile Details'}
          </Button>
        </div>
      </div>

      {/* 2. Security & Password */}
      <div className="flex flex-col gap-5 rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-surface-5 pb-4">
          <Lock size={20} className="text-fg-muted" />
          <h3 className="title-3 text-fg">
            {profile.hasPassword ? 'Change Password' : 'Set Account Password'}
          </h3>
        </div>

        {passwordNotice && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
              passwordNotice.tone === 'ok'
                ? 'border border-status-available/30 bg-status-available/10 text-status-available'
                : 'border border-status-urgent/30 bg-status-urgent/10 text-status-urgent'
            }`}
          >
            {passwordNotice.tone === 'ok' ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{passwordNotice.text}</span>
          </div>
        )}

        {!profile.hasPassword && (
          <p className="caption-1 text-fg-muted">
            You registered using <strong>Google Sign-in</strong>. Setting a password allows you to sign in with your email and password directly as well as through Google.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {profile.hasPassword && (
            <div className="flex flex-col gap-1.5">
              <label className="caption-2 text-fg font-medium">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg font-medium">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 chars with uppercase, lowercase, and number"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="caption-2 text-fg font-medium">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="secondary"
            disabled={passwordMutation.isPending || !newPassword || !confirmPassword}
            onClick={() => passwordMutation.mutate()}
          >
            {passwordMutation.isPending
              ? 'Updating...'
              : profile.hasPassword
              ? 'Update Password'
              : 'Set Account Password'}
          </Button>
        </div>
      </div>
    </div>
  );
}
