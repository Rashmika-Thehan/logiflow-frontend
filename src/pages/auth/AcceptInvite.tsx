import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { invitationsApi } from '@/api/join.api';
import { getErrorMessage } from '@/api/client';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { isStrongPassword } from '@/lib/password';

const schema = z.object({
    fullName: z.string().trim().min(2, 'Enter your full name.'),
    phone: z.string().regex(/^\+?[0-9 ]{7,15}$/, 'Enter a phone number with country code, for example +94 77 123 4567.'),
    password: z.string().refine(isStrongPassword, 'Use at least 8 characters with upper case, lower case and a number.'),
});
type Values = z.infer<typeof schema>;

export default function AcceptInvite() {
    const [params] = useSearchParams();
    const token = params.get('token');
    const navigate = useNavigate();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '' } });

    if (!token) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="heading-4">Invitation link is incomplete</h1>
                <p className="body-6 text-fg-muted">
                    Open the link from your invitation email again, or ask your administrator to send a new one.
                </p>
                <Button asChild variant="secondary" className="w-fit"><Link to="/">Back to home</Link></Button>
            </div>
        );
    }

    const onSubmit = async (values: Values) => {
        setFormError('');
        try {
            await invitationsApi.accept({ token, ...values });
            navigate('/login', { replace: true });
        } catch (err) {
            setFormError(getErrorMessage(err, 'This invitation is invalid or has expired. Ask your administrator for a new one.'));
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="heading-4">Accept your invitation</h1>
                <p className="body-6 text-fg-muted">Set up your account to join your team.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <Field id="fullName" label="Full name" error={errors.fullName?.message}>
                    <Input id="fullName" autoComplete="name" {...register('fullName')} />
                </Field>
                <Field id="phone" label="Phone" error={errors.phone?.message}>
                    <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
                </Field>
                <div className="flex flex-col gap-2">
                    <Field id="password" label="Password" error={errors.password?.message}>
                        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
                    </Field>
                    <PasswordMeter value={watch('password')} />
                </div>
                {formError && (
                    <p role="alert" className="caption-2 text-status-urgent">
                        {formError}
                    </p>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account' : 'Create account'}
                </Button>
            </form>
        </div>
    );
}