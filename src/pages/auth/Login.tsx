import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { homePathForRole, useAuthStore } from '@/stores/authStore';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});
type Values = z.infer<typeof schema>;

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setFormError('');
    try {
      const user = await login(values);
      navigate(homePathForRole(user.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Sign in failed. Check your email and password, then try again.'));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="heading-4">Sign in</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="caption-1">Email</label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p role="alert" className="caption-2 text-status-urgent">{errors.email.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="caption-1">Password</label>
          <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
          {errors.password && <p role="alert" className="caption-2 text-status-urgent">{errors.password.message}</p>}
        </div>
        {formError && <p role="alert" className="caption-2 text-status-urgent">{formError}</p>}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in' : 'Sign in'}</Button>
        <Button type="button" variant="secondary" onClick={() => { window.location.href = authApi.googleUrl; }}>Continue with Google</Button>
      </form>
      <p className="body-6 text-fg-muted">New to LogiFlow? <Link to="/register" className="text-fg underline">Create an organization</Link></p>
    </div>
  );
}
