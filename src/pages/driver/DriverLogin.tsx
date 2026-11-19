import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { SteeringWheel, Truck, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { homePathForRole, useAuthStore } from '@/stores/authStore';
import driverLoginImage from '@/assets/driver-login.png';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type Values = z.infer<typeof schema>;

export default function DriverLogin() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setFormError('');
    try {
      const user = await login(values);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setFormError(
        getErrorMessage(err, 'Sign in failed. Check your email and password, then try again.'),
      );
    }
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col justify-between px-4 py-8 sm:px-6">
      <img
        src={driverLoginImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 h-full w-full object-cover object-[65%_50%]"
      />
      <div className="absolute inset-0 z-10 bg-black/55" />
      <div className="relative z-20 mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fg text-surface-0 shadow-lg shadow-fg/10 mb-4">
            <SteeringWheel size={30} weight="duotone" />
          </div>
          <h1 className="heading-4 text-fg font-bold">Driver Portal</h1>
          <p className="body-6 text-fg-muted mt-1.5">
            Sign in to your courier account to manage shifts and accept dispatch orders.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-surface-5 bg-surface-2 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="caption-1 text-fg">
                Driver Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="driver@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
                className="py-2.5"
              />
              {errors.email && (
                <p role="alert" className="caption-2 text-status-urgent">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="caption-1 text-fg">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                {...register('password')}
                className="py-2.5"
              />
              {errors.password && (
                <p role="alert" className="caption-2 text-status-urgent">
                  {errors.password.message}
                </p>
              )}
            </div>

            {formError && (
              <p role="alert" className="caption-2 text-status-urgent">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full gap-2 mt-2 font-semibold shadow-md active:scale-[0.98]"
            >
              <Truck size={18} />
              {isSubmitting ? 'Verifying...' : 'Sign in to Shift'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = authApi.googleUrl;
              }}
              className="w-full gap-2"
            >
              Continue with Google
            </Button>
          </form>

          {/* Quick Links */}
          <div className="mt-6 flex flex-col gap-3 pt-5 border-t border-surface-4 text-center">
            <Link
              to="/driver/apply"
              className="flex items-center justify-center gap-1.5 caption-1 font-medium text-fg hover:underline"
            >
              <span>Want to drive with us? Apply to join</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/login"
              className="caption-2 text-fg-muted hover:text-fg transition-colors"
            >
              Business Admin or Dispatcher? Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Safety Footer Note */}
      <div className="mx-auto flex items-center gap-2 text-xs text-fg-muted mt-8">
        <ShieldCheck size={16} className="text-status-available" />
        <span>LogiFlow Secure Driver Network</span>
      </div>
    </div>
  );
}
