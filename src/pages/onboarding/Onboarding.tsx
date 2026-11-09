import { ArrowClockwise, Copy } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { branchesApi, dispatchApi, joinCodeApi } from '@/api/org.api';
import { getErrorMessage } from '@/api/client';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EASE_BRAND } from '@/lib/utils';
import { Field } from '@/components/ui/field';

const steps = ['Depot', 'Dispatch rules', 'Join code'];

/* Step 1 */
const branchSchema = z.object({
    name: z.string().trim().min(2, 'Enter a depot name.'),
    address: z.string().trim().min(5, 'Enter the depot address.'),
    latitude: z.number({ message: 'Enter a latitude.' }).min(-90).max(90),
    longitude: z.number({ message: 'Enter a longitude.' }).min(-180).max(180),
    phone: z.string().optional(),
});
type BranchValues = z.infer<typeof branchSchema>;

function BranchStep({ onDone }: { onDone: () => void }) {
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<BranchValues>({ resolver: zodResolver(branchSchema) });

    const useMyLocation = () =>
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setValue('latitude', Number(pos.coords.latitude.toFixed(6)), { shouldValidate: true });
                setValue('longitude', Number(pos.coords.longitude.toFixed(6)), { shouldValidate: true });
            },
            () => setError('Location access was blocked. Enter the coordinates by hand.'),
        );

    const onSubmit = async (values: BranchValues) => {
        setError('');
        try {
            await branchesApi.create({ ...values, phone: values.phone || undefined });
            onDone();
        } catch (err) {
            setError(getErrorMessage(err, 'We could not save the depot. Check the details and try again.'));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field id="name" label="Depot name" error={errors.name?.message}>
                <Input id="name" {...register('name')} />
            </Field>
            <Field id="address" label="Address" error={errors.address?.message}>
                <Input id="address" autoComplete="street-address" {...register('address')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field id="latitude" label="Latitude" error={errors.latitude?.message}>
                    <Input id="latitude" inputMode="decimal" {...register('latitude', { valueAsNumber: true })} />
                </Field>
                <Field id="longitude" label="Longitude" error={errors.longitude?.message}>
                    <Input id="longitude" inputMode="decimal" {...register('longitude', { valueAsNumber: true })} />
                </Field>
            </div>
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={useMyLocation}>
                Use my current location
            </Button>
            <Field id="phone" label="Phone (optional)">
                <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
            </Field>
            {error && <p role="alert" className="caption-2 text-status-urgent">{error}</p>}
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving depot' : 'Save and continue'}</Button>
                <Button type="button" variant="ghost" onClick={onDone}>Skip for now</Button>
            </div>
        </form>
    );
}

/* Step 2 */
const policySchema = z
    .object({
        allowPlatformDrivers: z.boolean(),
        acknowledgeDataSharing: z.boolean(),
        maxOwnAttempts: z
            .number({ message: 'Enter a number from 1 to 10.' })
            .int()
            .min(1, 'Enter a number from 1 to 10.')
            .max(10, 'Enter a number from 1 to 10.'),
    })
    .refine((v) => !v.allowPlatformDrivers || v.acknowledgeDataSharing, {
        path: ['acknowledgeDataSharing'],
        message: 'Confirm data sharing to use the platform driver pool.',
    });
type PolicyValues = z.infer<typeof policySchema>;

function PolicyStep({ onDone }: { onDone: () => void }) {
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<PolicyValues>({
        resolver: zodResolver(policySchema),
        defaultValues: { allowPlatformDrivers: false, acknowledgeDataSharing: false, maxOwnAttempts: 3 },
    });
    const allow = watch('allowPlatformDrivers');

    const onSubmit = async (values: PolicyValues) => {
        setError('');
        try {
            await dispatchApi.updateSettings({
                allowPlatformDrivers: values.allowPlatformDrivers,
                maxOwnAttempts: values.maxOwnAttempts,
                ...(values.allowPlatformDrivers ? { acknowledgeDataSharing: true } : {}),
            });
            onDone();
        } catch (err) {
            setError(getErrorMessage(err, 'We could not save the dispatch rules. Try again.'));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Field id="maxOwnAttempts" label="Attempts with your own drivers before falling back" error={errors.maxOwnAttempts?.message}>
                <Input id="maxOwnAttempts" type="number" min={1} max={10} {...register('maxOwnAttempts', { valueAsNumber: true })} />
            </Field>
            <label className="body-5 flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4" {...register('allowPlatformDrivers')} />
                Allow the platform driver pool when my own drivers decline
            </label>
            {allow && (
                <Field id="ack" label="Data sharing" error={errors.acknowledgeDataSharing?.message}>
                    <label className="body-6 flex items-start gap-3 text-fg-muted">
                        <input id="ack" type="checkbox" className="mt-1 h-4 w-4" {...register('acknowledgeDataSharing')} />
                        I understand that platform drivers receive the job details needed to complete a delivery.
                    </label>
                </Field>
            )}
            {error && <p role="alert" className="caption-2 text-status-urgent">{error}</p>}
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving rules' : 'Save and continue'}</Button>
                <Button type="button" variant="ghost" onClick={onDone}>Skip for now</Button>
            </div>
        </form>
    );
}

/* Step 3 */
function JoinCodeStep({ onFinish }: { onFinish: () => void }) {
    const [code, setCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const load = async (rotate = false) => {
        setLoading(true);
        setError('');
        try {
            const existing = rotate ? null : await joinCodeApi.get().catch(() => null);
            setCode(existing ?? (await joinCodeApi.generate()));
        } catch (err) {
            setError(getErrorMessage(err, 'We could not load the join code. Try again.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const copy = async () => {
        if (!code) return;
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="body-6 text-fg-muted">
                Drivers and dispatchers enter this code on the join page to request access. You approve each request.
            </p>
            <div className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-surface-5 bg-surface-3 p-3">
                {loading ? (
                    <span className="h-6 w-32 rounded-lg bg-surface-4" aria-label="Loading join code" />
                ) : (
                    <p className="heading-5 tracking-wide">{code ?? 'No code yet'}</p>
                )}
                <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={copy} disabled={!code}>
                        <Copy size={16} aria-hidden="true" />
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void load(true)} disabled={loading}>
                        <ArrowClockwise size={16} aria-hidden="true" />
                        New code
                    </Button>
                </div>
            </div>
            {error && <p role="alert" className="caption-2 text-status-urgent">{error}</p>}
            <Button className="w-fit" onClick={onFinish}>Go to the control tower</Button>
        </div>
    );
}

/* Wizard */
export default function Onboarding() {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();
    const reduce = useReducedMotion();
    const next = () => setStep((s) => s + 1);

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 py-12">
            <Logo />
            <ol className="flex gap-2" aria-label="Setup progress">
                {steps.map((label, i) => (
                    <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
                        <span className={`block h-1 rounded-full transition-colors duration-300 ease-brand ${i <= step ? 'bg-fg' : 'bg-surface-5'}`} />
                        <span className={`caption-1 mt-2 block ${i === step ? 'text-fg' : 'text-fg-muted'}`}>{label}</span>
                    </li>
                ))}
            </ol>
            <h1 className="heading-4">{['Add your main depot', 'Set your dispatch rules', 'Share your join code'][step]}</h1>
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE_BRAND }}
                >
                    {step === 0 && <BranchStep onDone={next} />}
                    {step === 1 && <PolicyStep onDone={next} />}
                    {step === 2 && <JoinCodeStep onFinish={() => navigate('/dashboard/dispatch', { replace: true })} />}
                </motion.div>
            </AnimatePresence>
        </main>
    );
}