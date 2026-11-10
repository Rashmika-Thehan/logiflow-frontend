import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { joinApi } from '@/api/join.api';
import { getErrorMessage } from '@/api/client';
import { PasswordMeter } from '@/components/auth/PasswordMeter';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { isStrongPassword } from '@/lib/password';

const STORAGE_KEY = 'logiflow.joinRequestId';
const readStored = () => {
    try {
        return sessionStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};
const writeStored = (id: string | null) => {
    try {
        if (id) sessionStorage.setItem(STORAGE_KEY, id);
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        /* storage unavailable, the flow still works for this page load */
    }
};

const base = {
    fullName: z.string().trim().min(2, 'Enter your full name.'),
    email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
    phone: z.string().regex(/^\+?[0-9 ]{7,15}$/, 'Enter a phone number with country code, for example +94 77 123 4567.'),
    password: z.string().refine(isStrongPassword, 'Use at least 8 characters with upper case, lower case and a number.'),
};
const orgSchema = z.object({
    ...base,
    joinCode: z.string().trim().min(4, 'Enter the join code from your organization.'),
    role: z.enum(['DRIVER', 'DISPATCHER']),
});
const platformSchema = z.object(base);
type OrgValues = z.infer<typeof orgSchema>;
type PlatformValues = z.infer<typeof platformSchema>;

/* Step 1: request form */
function RequestForm({ onCreated }: { onCreated: (id: string) => void }) {
    const [mode, setMode] = useState<'org' | 'platform'>('org');
    const [error, setError] = useState('');
    const schema = mode === 'org' ? orgSchema : platformSchema;
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<OrgValues>({
        resolver: zodResolver(schema) as never,
        defaultValues: { role: 'DRIVER', password: '' },
    });

    const onSubmit = async (values: OrgValues | PlatformValues) => {
        setError('');
        try {
            const id =
                mode === 'org'
                    ? await joinApi.submit(values as OrgValues)
                    : await joinApi.submitPlatformDriver(values as PlatformValues);
            if (!id) throw new Error('missing id');
            onCreated(id);
        } catch (err) {
            setError(getErrorMessage(err, 'We could not send your request. Check the details and try again.'));
        }
    };

    const tab = (value: 'org' | 'platform', label: string) => (
        <button
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
                setMode(value);
                setError('');
                reset({ role: 'DRIVER', password: '' });
            }}
            className={`body-5 flex-1 rounded-lg px-3 py-2 transition-colors duration-300 ease-brand ${mode === value ? 'bg-surface-4 text-fg' : 'text-fg-muted hover:text-fg'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col gap-6">
            <h1 className="heading-4">Join LogiFlow</h1>
            <div role="tablist" aria-label="Join type" className="flex gap-1 rounded-lg border border-surface-5 bg-surface-2 p-1">
                {tab('org', 'Join an organization')}
                {tab('platform', 'Independent driver')}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                {mode === 'org' && (
                    <>
                        <Field id="joinCode" label="Organization join code" error={errors.joinCode?.message}>
                            <Input id="joinCode" autoCapitalize="characters" autoComplete="off" {...register('joinCode')} />
                        </Field>
                        <Field id="role" label="Role">
                            <select id="role" className="body-5 w-full rounded-lg border border-surface-5 bg-surface-3 px-3 py-2" {...register('role')}>
                                <option value="DRIVER">Driver</option>
                                <option value="DISPATCHER">Dispatcher</option>
                            </select>
                        </Field>
                    </>
                )}
                <Field id="fullName" label="Full name" error={errors.fullName?.message}>
                    <Input id="fullName" autoComplete="name" {...register('fullName')} />
                </Field>
                <Field id="email" label="Email" error={errors.email?.message}>
                    <Input id="email" type="email" autoComplete="email" {...register('email')} />
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
                {error && (
                    <p role="alert" className="caption-2 text-status-urgent">
                        {error}
                    </p>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending request' : 'Send request'}
                </Button>
            </form>
            <p className="body-6 text-fg-muted">
                Already approved? <Link to="/login" className="text-fg underline">Sign in</Link>
            </p>
        </div>
    );
}

/* Step 2: email code */
function VerifyStep({ id, onVerified }: { id: string; onVerified: () => void }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(30);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(code)) {
            setError('Enter the 6 digit code from your email.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await joinApi.verifyEmail(id, code);
            onVerified();
        } catch (err) {
            setError(getErrorMessage(err, 'That code did not work. Check it and try again.'));
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        if (resending || cooldown > 0) return;
        setResending(true);
        setError('');
        try {
            await joinApi.resendCode(id);
            setResent(true);
            setCooldown(30);
        } catch (err) {
            setError(getErrorMessage(err, 'We could not send a new code. Try again in a moment.'));
        } finally {
            setResending(false);
        }
    };

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <h1 className="heading-4">Check your email</h1>
            <p className="body-6 text-fg-muted">We sent a 6 digit code to confirm your address.</p>
            <Field id="code" label="Verification code" error={error}>
                <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    aria-invalid={!!error}
                    className="heading-6 tracking-widest"
                />
            </Field>
            {resent && cooldown > 0 && <p className="caption-2 text-status-available">A new code is on its way.</p>}
            <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                    {busy ? 'Verifying' : 'Verify email'}
                </Button>
                <Button type="button" variant="ghost" disabled={resending || cooldown > 0} onClick={resend}>
                    {resending ? 'Resending code' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </Button>
            </div>
        </form>
    );
}

/* Step 3: approval status */
function StatusStep({ id, onReset }: { id: string; onReset: () => void }) {
    const { data, isError } = useQuery({
        queryKey: ['join-status', id],
        queryFn: () => joinApi.status(id),
        refetchInterval: (q) => (q.state.data?.status === 'PENDING' || !q.state.data ? 5000 : false),
    });

    if (isError) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="heading-4">We could not load your request</h1>
                <p className="body-6 text-fg-muted">The request may have expired. Start a new one to continue.</p>
                <Button className="w-fit" onClick={onReset}>Start again</Button>
            </div>
        );
    }
    if (data?.status === 'APPROVED') {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="heading-4">You are approved</h1>
                <p className="body-6 text-fg-muted">Sign in with the email and password you just set.</p>
                <Button asChild className="w-fit"><Link to="/login">Sign in</Link></Button>
            </div>
        );
    }
    if (data?.status === 'REJECTED') {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="heading-4">Request declined</h1>
                <p className="body-6 text-fg-muted">{data.reason ?? 'The organization did not approve this request.'}</p>
                <Button className="w-fit" variant="secondary" onClick={onReset}>Try another code</Button>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-4" aria-busy="true">
            <h1 className="heading-4">Waiting for approval</h1>
            <p className="body-6 text-fg-muted">
                Your email is confirmed. An administrator needs to approve your request. This page updates by itself.
            </p>
        </div>
    );
}

export default function Join() {
    const [id, setId] = useState<string | null>(readStored);
    const [verified, setVerified] = useState(false);

    const reset = () => {
        writeStored(null);
        setId(null);
        setVerified(false);
    };

    if (!id) return <RequestForm onCreated={(newId) => { writeStored(newId); setId(newId); }} />;
    if (!verified) return <VerifyStep id={id} onVerified={() => setVerified(true)} />;
    return <StatusStep id={id} onReset={reset} />;
}