import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ShieldWarning, SlidersHorizontal, Sparkle } from '@phosphor-icons/react';
import { dispatchApi, type DispatchSettingsInput } from '@/api/org.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';

const schema = z.object({
  allowPlatformDrivers: z.boolean(),
  maxOwnAttempts: z.number().min(1, 'Minimum 1 attempt').max(10, 'Maximum 10 attempts'),
  acknowledgeDataSharing: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export function DispatchPolicyTab() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const { data: settings, isPending } = useQuery({
    queryKey: ['dispatch-settings'],
    queryFn: dispatchApi.getSettings,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowPlatformDrivers: false,
      maxOwnAttempts: 3,
      acknowledgeDataSharing: false,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        allowPlatformDrivers: settings.allowPlatformDrivers,
        maxOwnAttempts: settings.maxOwnAttempts,
        acknowledgeDataSharing: settings.allowPlatformDrivers,
      });
    }
  }, [settings, reset]);

  const allowPlatform = watch('allowPlatformDrivers');
  const attempts = watch('maxOwnAttempts');

  const updateMutation = useMutation({
    mutationFn: (values: DispatchSettingsInput) => dispatchApi.updateSettings(values),
    onSuccess: () => {
      setNotice({ tone: 'ok', text: 'Dispatch policy updated successfully.' });
      void queryClient.invalidateQueries({ queryKey: ['dispatch-settings'] });
    },
    onError: (err) => setNotice({ tone: 'error', text: getErrorMessage(err, 'Failed to update policy.') }),
  });

  const onSubmit = (values: FormValues) => {
    setNotice(null);
    if (values.allowPlatformDrivers && !values.acknowledgeDataSharing) {
      setNotice({
        tone: 'error',
        text: 'You must acknowledge the customer data sharing policy to enable platform drivers.',
      });
      return;
    }

    updateMutation.mutate({
      allowPlatformDrivers: values.allowPlatformDrivers,
      maxOwnAttempts: values.maxOwnAttempts,
      acknowledgeDataSharing: values.acknowledgeDataSharing,
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="heading-5">Dispatch Rules & Policy</h2>
        <p className="body-6 text-fg-muted">
          Configure how the autonomous dispatch engine pairs shipments with your in-house fleet and third-party platform drivers.
        </p>
      </div>

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

      {isPending ? (
        <div className="h-64 w-full rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 rounded-2xl border border-surface-5 bg-surface-2 p-6">
          {/* Policy 1: Internal Attempt Count */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="maxOwnAttempts" className="title-3 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-fg-muted" />
                In-House Matching Attempts
              </label>
              <span className="caption-1 font-mono rounded-lg border border-surface-5 bg-surface-3 px-3 py-1 font-semibold text-fg">
                {attempts} attempt{attempts > 1 ? 's' : ''}
              </span>
            </div>
            <p className="caption-1 text-fg-muted">
              How many times the matching engine will offer a package to candidate drivers in your own organization before escalating or falling back.
            </p>
            <input
              id="maxOwnAttempts"
              type="range"
              min={1}
              max={6}
              step={1}
              className="accent-fg h-2 w-full cursor-pointer rounded-lg bg-surface-4"
              {...register('maxOwnAttempts', { valueAsNumber: true })}
            />
            <div className="flex justify-between caption-2 text-fg-muted">
              <span>1 attempt (Fastest escalation)</span>
              <span>3 (Default)</span>
              <span>6 attempts</span>
            </div>
          </div>

          <div className="h-px w-full bg-surface-5" />

          {/* Policy 2: Platform Driver Pool */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-5 bg-surface-3">
                  <Sparkle size={20} className="text-fg" />
                </div>
                <div>
                  <h3 className="title-3">Platform Driver Pool Fallback</h3>
                  <p className="caption-1 text-fg-muted">
                    Tap into LogiFlow's verified freelance platform drivers when your in-house fleet has no available capacity or reaches maximum attempts.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={allowPlatform}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setValue('allowPlatformDrivers', next, { shouldValidate: true });
                    if (!next) setValue('acknowledgeDataSharing', false);
                  }}
                />
                <div className="h-6 w-11 rounded-full bg-surface-4 peer-checked:bg-status-available peer-focus:outline-none after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-fg after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:bg-surface-0" />
              </label>
            </div>

            {allowPlatform && (
              <div className="flex flex-col gap-3 rounded-xl border border-status-break/40 bg-status-break/10 p-4">
                <div className="flex items-start gap-3 text-status-break">
                  <ShieldWarning size={22} className="shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p className="title-3">Data Sharing Acknowledgment Required</p>
                    <p className="caption-1">
                      Dispatching shipments to platform drivers shares parcel dropoff neighborhood, recipient names, addresses, and phone numbers with independent drivers outside your organization.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-surface-5 bg-surface-3 text-fg focus:ring-0"
                    {...register('acknowledgeDataSharing')}
                  />
                  <span className="caption-1 text-fg">
                    I acknowledge that customer delivery data will be shared with verified independent platform drivers when dispatched.
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending} className="gap-2">
              <Check size={18} />
              {isSubmitting || updateMutation.isPending ? 'Saving Policy...' : 'Save Dispatch Rules'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
