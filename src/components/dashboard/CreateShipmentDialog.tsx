import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/api/client';
import { shipmentsApi, type CreateShipmentInput } from '@/api/shipments.api';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const positive = (label: string) => z.number({ message: `Enter the ${label}.` }).positive(`Enter the ${label}.`);

const schema = z
    .object({
        recipientName: z.string().trim().min(2, 'Enter the recipient name.'),
        recipientPhone: z.string().regex(/^\+?[0-9 ]{7,15}$/, 'Enter a phone number with country code.'),
        recipientEmail: z.string().email('Enter a valid email address.').or(z.literal('')),
        recipientAddress: z.string().trim().min(5, 'Enter the delivery address.'),
        recipientLat: z.number({ message: 'Enter a latitude.' }).min(-90).max(90),
        recipientLng: z.number({ message: 'Enter a longitude.' }).min(-180).max(180),
        weightKg: positive('weight in kg'),
        lengthCm: positive('length in cm'),
        widthCm: positive('width in cm'),
        heightCm: positive('height in cm'),
        priority: z.enum(['STANDARD', 'EXPRESS', 'URGENT']),
        deliveryWindowStart: z.string(),
        deliveryWindowEnd: z.string(),
    })
    .refine((v) => !v.deliveryWindowStart || !v.deliveryWindowEnd || v.deliveryWindowEnd > v.deliveryWindowStart, {
        path: ['deliveryWindowEnd'],
        message: 'The window must end after it starts.',
    });
type Values = z.infer<typeof schema>;

const toIso = (local: string) => (local ? new Date(local).toISOString() : undefined);

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: (trackingCode: string) => void;
}

export function CreateShipmentDialog({ open, onClose, onCreated }: Props) {
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { priority: 'STANDARD' } });

    const create = useMutation({
        mutationFn: (input: CreateShipmentInput) => shipmentsApi.create(input),
        onSuccess: (shipment) => onCreated(shipment.trackingCode),
        onError: (err) => setFormError(getErrorMessage(err, 'We could not create the shipment. Check the details and try again.')),
    });

    const onSubmit = (v: Values) => {
        setFormError('');
        create.mutate({
            ...v,
            recipientEmail: v.recipientEmail || undefined,
            deliveryWindowStart: toIso(v.deliveryWindowStart),
            deliveryWindowEnd: toIso(v.deliveryWindowEnd),
        });
    };

    const num = (name: keyof Values) => register(name, { valueAsNumber: true });

    return (
        <Modal open={open} onClose={onClose} title="Create shipment">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                <Field id="recipientName" label="Recipient name" error={errors.recipientName?.message}>
                    <Input id="recipientName" autoComplete="off" {...register('recipientName')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="recipientPhone" label="Recipient phone" error={errors.recipientPhone?.message}>
                        <Input id="recipientPhone" type="tel" autoComplete="off" {...register('recipientPhone')} />
                    </Field>
                    <Field id="recipientEmail" label="Recipient email (for the delivery code)" error={errors.recipientEmail?.message}>
                        <Input id="recipientEmail" type="email" autoComplete="off" {...register('recipientEmail')} />
                    </Field>
                </div>
                <Field id="recipientAddress" label="Delivery address" error={errors.recipientAddress?.message}>
                    <Input id="recipientAddress" autoComplete="off" {...register('recipientAddress')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="recipientLat" label="Latitude" error={errors.recipientLat?.message}>
                        <Input id="recipientLat" inputMode="decimal" {...num('recipientLat')} />
                    </Field>
                    <Field id="recipientLng" label="Longitude" error={errors.recipientLng?.message}>
                        <Input id="recipientLng" inputMode="decimal" {...num('recipientLng')} />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                    <Field id="weightKg" label="Weight (kg)" error={errors.weightKg?.message}>
                        <Input id="weightKg" inputMode="decimal" {...num('weightKg')} />
                    </Field>
                    <Field id="lengthCm" label="Length (cm)" error={errors.lengthCm?.message}>
                        <Input id="lengthCm" inputMode="decimal" {...num('lengthCm')} />
                    </Field>
                    <Field id="widthCm" label="Width (cm)" error={errors.widthCm?.message}>
                        <Input id="widthCm" inputMode="decimal" {...num('widthCm')} />
                    </Field>
                    <Field id="heightCm" label="Height (cm)" error={errors.heightCm?.message}>
                        <Input id="heightCm" inputMode="decimal" {...num('heightCm')} />
                    </Field>
                </div>
                <Field id="priority" label="Priority">
                    <select id="priority" className="body-5 w-full rounded-lg border border-surface-5 bg-surface-3 px-3 py-2" {...register('priority')}>
                        <option value="STANDARD">Standard</option>
                        <option value="EXPRESS">Express</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="deliveryWindowStart" label="Window starts (optional)">
                        <Input id="deliveryWindowStart" type="datetime-local" {...register('deliveryWindowStart')} />
                    </Field>
                    <Field id="deliveryWindowEnd" label="Window ends (optional)" error={errors.deliveryWindowEnd?.message}>
                        <Input id="deliveryWindowEnd" type="datetime-local" {...register('deliveryWindowEnd')} />
                    </Field>
                </div>
                {formError && (
                    <p role="alert" className="caption-2 text-status-urgent">
                        {formError}
                    </p>
                )}
                <div className="flex gap-2">
                    <Button type="submit" disabled={create.isPending}>
                        {create.isPending ? 'Creating shipment' : 'Create shipment'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}