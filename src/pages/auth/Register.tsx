import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/api/client';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isStrongPassword } from '@/lib/password';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
    tenantName: z.string().trim().min(2, 'Enter your organization name.'),
    email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
    password: z.string().refine(isStrongPassword, 'Use at least 8 characters with upper case, lower case and a number.'),
});
type Values = z.infer<typeof schema>;

export default function Register() {
    const registerUser = useAuthStore((s) => s.register);
    const navigate = useNavigate();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '' } });

    const onSubmit = async (values: Values) => {
        setFormError('');
        try {
            await registerUser(values);
            navigate('/onboarding', { replace: true });
        } catch (err) {
            setFormError(getErrorMessage(err, 'We could not create the organization. Check the details and try again.'));
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="heading-4">Create your organization</h1>
                <p className="body-6 text-fg-muted">
                    Start your 14 day free trial. You will set up a depot and dispatch rules next.
                </p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="tenantName" className="caption-1">Organization name</label>
                    <Input id="tenantName" autoComplete="organization" aria-invalid={!!errors.tenantName} {...register('tenantName')} />
                    {errors.tenantName && <p role="alert" className="caption-2 text-status-urgent">{errors.tenantName.message}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="caption-1">Work email</label>
                    <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
                    {errors.email && <p role="alert" className="caption-2 text-status-urgent">{errors.email.message}</p>}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="caption-1">Password</label>
                    <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
                    <PasswordMeter value={watch('password')} />
                    {errors.password && <p role="alert" className="caption-2 text-status-urgent">{errors.password.message}</p>}
                </div>
                {formError && <p role="alert" className="caption-2 text-status-urgent">{formError}</p>}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating organization' : 'Start free trial'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { window.location.href = authApi.googleUrl; }}>
                    Continue with Google
                </Button>
            </form>
            <p className="body-6 text-fg-muted">
                Already have an account? <Link to="/login" className="text-fg underline">Sign in</Link>
            </p>
        </div>
    );
}