import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  SteeringWheel,
  CheckCircle,
  Buildings,
  Sparkle,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { joinApi } from '@/api/join.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { isStrongPassword } from '@/lib/password';

const driverApplySchema = z.object({
  mode: z.enum(['org', 'platform']),
  joinCode: z.string().optional(),
  fullName: z.string().trim().min(2, 'Enter your full legal name.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{7,15}$/, 'Enter a valid phone number (e.g. +94 77 123 4567).'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .refine(isStrongPassword, 'Include uppercase, lowercase, and a number.'),
}).refine(
  (data) => {
    if (data.mode === 'org') {
      return Boolean(data.joinCode && data.joinCode.trim().length >= 4);
    }
    return true;
  },
  {
    message: 'Enter the organization join code.',
    path: ['joinCode'],
  },
);

type FormValues = z.infer<typeof driverApplySchema>;

export default function DriverApply() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'verify' | 'completed'>('form');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(driverApplySchema),
    defaultValues: { mode: 'platform' },
  });

  const selectedMode = watch('mode');
  const watchedPassword = watch('password') || '';

  const onSubmit = async (values: FormValues) => {
    setSubmitError('');
    try {
      let id: string | null = null;
      if (values.mode === 'org' && values.joinCode) {
        id = await joinApi.submit({
          joinCode: values.joinCode.trim().toUpperCase(),
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: 'DRIVER',
        });
      } else {
        id = await joinApi.submitPlatformDriver({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
        });
      }

      if (id) {
        setRequestId(id);
        setStep('verify');
      } else {
        setSubmitError('Failed to initialize application. Please try again.');
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Application submission failed.'));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId || otpCode.trim().length < 4) return;
    setOtpError('');
    setVerifying(true);
    try {
      await joinApi.verifyEmail(requestId, otpCode.trim());
      setStep('completed');
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface-0 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fg text-surface-0 shadow-lg shadow-fg/10 mb-4">
            <SteeringWheel size={30} weight="duotone" />
          </div>
          <h1 className="heading-4 font-bold text-fg">Apply to Drive</h1>
          <p className="body-6 text-fg-muted mt-1.5">
            Join the LogiFlow courier network as a dedicated fleet or independent driver.
          </p>
        </div>

        {/* Step 1: Initial Application Form */}
        {step === 'form' && (
          <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              {/* Mode Selection Toggle */}
              <div className="flex flex-col gap-1.5">
                <span className="caption-1 text-fg">Driver Category</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('mode', 'platform')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      selectedMode === 'platform'
                        ? 'border-fg bg-surface-3 shadow-sm ring-2 ring-fg/10'
                        : 'border-surface-5 bg-surface-1 text-fg-muted hover:bg-surface-3'
                    }`}
                  >
                    <Sparkle size={20} className={selectedMode === 'platform' ? 'text-fg' : ''} />
                    <span className="caption-1 font-semibold">Independent</span>
                    <span className="caption-2 text-[10px] text-fg-muted">Freelance marketplace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue('mode', 'org')}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                      selectedMode === 'org'
                        ? 'border-fg bg-surface-3 shadow-sm ring-2 ring-fg/10'
                        : 'border-surface-5 bg-surface-1 text-fg-muted hover:bg-surface-3'
                    }`}
                  >
                    <Buildings size={20} className={selectedMode === 'org' ? 'text-fg' : ''} />
                    <span className="caption-1 font-semibold">Company Fleet</span>
                    <span className="caption-2 text-[10px] text-fg-muted">Has Organization Code</span>
                  </button>
                </div>
              </div>

              {/* Join Code Input (if Company Fleet mode) */}
              {selectedMode === 'org' && (
                <Field
                  id="joinCode"
                  label="Organization Join Code"
                  error={errors.joinCode?.message}
                >
                  <Input
                    id="joinCode"
                    autoComplete="off"
                    placeholder="e.g. SWIFT-892"
                    className="uppercase font-mono tracking-wider"
                    {...register('joinCode')}
                  />
                  <p className="caption-2 text-fg-muted">
                    Provided by the business or logistics team that invited you.
                  </p>
                </Field>
              )}

              <Field id="fullName" label="Full Legal Name" error={errors.fullName?.message}>
                <Input id="fullName" placeholder="Alex Rivera" {...register('fullName')} />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="email" label="Email Address" error={errors.email?.message}>
                  <Input id="email" type="email" placeholder="alex@example.com" {...register('email')} />
                </Field>

                <Field id="phone" label="Phone Number" error={errors.phone?.message}>
                  <Input id="phone" type="tel" placeholder="+94 77 123 4567" {...register('phone')} />
                </Field>
              </div>

              <Field id="password" label="Create Password" error={errors.password?.message}>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                <PasswordMeter value={watchedPassword} />
              </Field>

              {submitError && (
                <p role="alert" className="caption-2 text-status-urgent">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full gap-2 mt-2 font-semibold shadow-md active:scale-[0.98]"
              >
                {isSubmitting ? 'Submitting Application...' : 'Continue to Verification'}
                <ArrowRight size={18} />
              </Button>
            </form>

            <div className="mt-5 text-center border-t border-surface-4 pt-4">
              <p className="caption-2 text-fg-muted">
                Already registered as a driver?{' '}
                <Link to="/driver/login" className="text-fg font-medium underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Email OTP Verification */}
        {step === 'verify' && (
          <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
            <h2 className="heading-6 text-center">Verify Your Email</h2>
            <p className="caption-1 text-fg-muted text-center mt-1">
              We sent a verification code to your email address. Enter the code below to confirm your application.
            </p>

            <form onSubmit={handleVerifyEmail} className="mt-5 flex flex-col gap-4">
              <Field id="otpCode" label="Verification Code" error={otpError}>
                <Input
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="text-center font-mono text-lg tracking-widest"
                  maxLength={8}
                />
              </Field>

              <Button type="submit" size="lg" disabled={verifying || otpCode.length < 4} className="w-full">
                {verifying ? 'Verifying...' : 'Verify Email & Complete'}
              </Button>
            </form>
          </div>
        )}

        {/* Step 3: Application Completed */}
        {step === 'completed' && (
          <div className="rounded-2xl border border-surface-5 bg-surface-2 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-available/10 text-status-available mb-4">
              <CheckCircle size={36} weight="fill" />
            </div>
            <h2 className="heading-5 font-bold text-fg">Application Submitted!</h2>
            <p className="body-6 text-fg-muted mt-2 leading-relaxed">
              Your email is verified. Your driver profile has been forwarded for credential review.
              Once your commercial credentials are approved, you will be notified to start driving.
            </p>

            <div className="mt-6">
              <Button onClick={() => navigate('/driver/login')} className="w-full">
                Back to Driver Login
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto flex items-center gap-2 text-xs text-fg-muted mt-8">
        <ShieldCheck size={16} className="text-status-available" />
        <span>Verified Driver Network</span>
      </div>
    </div>
  );
}
