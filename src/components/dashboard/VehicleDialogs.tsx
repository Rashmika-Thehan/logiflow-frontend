import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/api/client';
import { memberLabel, type TeamMember } from '@/api/users.api';
import { vehiclesApi } from '@/api/vehicles.api';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { todayIso, VEHICLE_CLASSES, vehicleClassLabel } from '@/lib/vehicle';
import type { Vehicle } from '@/types';

const SELECT = 'body-5 w-full rounded-lg border border-surface-5 bg-surface-3 px-3 py-2';
const FormError = ({ text }: { text: string }) =>
    text ? (
        <p role="alert" className="caption-2 text-status-urgent">
            {text}
        </p>
    ) : null;

const futureDate = z.string().refine((v) => !v || v >= todayIso(), 'This insurance has already expired. Enter a future date.');

/* Add vehicle */
const addSchema = z.object({
    licensePlate: z.string().trim().min(3, 'Enter the licence plate.'),
    vehicleClass: z.enum(['MOTORCYCLE', 'SEDAN', 'VAN', 'TRUCK']),
    maxWeightKg: z.number({ message: 'Enter the maximum load in kg.' }).positive('Enter the maximum load in kg.'),
    volumeM3: z.number({ message: 'Enter the cargo volume in m³.' }).positive('Enter the cargo volume in m³.'),
    insuranceExpiry: futureDate,
});
type AddValues = z.infer<typeof addSchema>;

export function AddVehicleDialog({
    open,
    onClose,
    onDone,
}: {
    open: boolean;
    onClose: () => void;
    onDone: (plate: string) => void;
}) {
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddValues>({ resolver: zodResolver(addSchema), defaultValues: { vehicleClass: 'VAN' } });

    const create = useMutation({
        mutationFn: (v: AddValues) => vehiclesApi.create({ ...v, insuranceExpiry: v.insuranceExpiry || undefined }),
        onSuccess: (vehicle) => onDone(vehicle.licensePlate),
        onError: (err) => setError(getErrorMessage(err, 'We could not add the vehicle. Check the details and try again.')),
    });

    return (
        <Modal open={open} onClose={onClose} title="Add vehicle">
            <form
                onSubmit={handleSubmit((v) => {
                    setError('');
                    create.mutate(v);
                })}
                noValidate
                className="flex flex-col gap-4"
            >
                <Field id="licensePlate" label="Licence plate" error={errors.licensePlate?.message}>
                    <Input id="licensePlate" autoCapitalize="characters" autoComplete="off" {...register('licensePlate')} />
                </Field>
                <Field id="vehicleClass" label="Vehicle class">
                    <select id="vehicleClass" className={SELECT} {...register('vehicleClass')}>
                        {VEHICLE_CLASSES.map((c) => (
                            <option key={c} value={c}>
                                {vehicleClassLabel(c)}
                            </option>
                        ))}
                    </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="maxWeightKg" label="Max load (kg)" error={errors.maxWeightKg?.message}>
                        <Input id="maxWeightKg" inputMode="decimal" {...register('maxWeightKg', { valueAsNumber: true })} />
                    </Field>
                    <Field id="volumeM3" label="Volume (m³)" error={errors.volumeM3?.message}>
                        <Input id="volumeM3" inputMode="decimal" {...register('volumeM3', { valueAsNumber: true })} />
                    </Field>
                </div>
                <Field id="insuranceExpiry" label="Insurance expires (optional)" error={errors.insuranceExpiry?.message}>
                    <Input id="insuranceExpiry" type="date" {...register('insuranceExpiry')} />
                </Field>
                <FormError text={error} />
                <div className="flex gap-2">
                    <Button type="submit" disabled={create.isPending}>
                        {create.isPending ? 'Adding vehicle' : 'Add vehicle'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* Assign driver */
export function AssignDriverDialog({
    vehicle,
    drivers,
    onClose,
    onDone,
}: {
    vehicle: Vehicle | null;
    drivers: TeamMember[];
    onClose: () => void;
    onDone: (plate: string) => void;
}) {
    const [driverId, setDriverId] = useState('');
    const [error, setError] = useState('');

    const assign = useMutation({
        mutationFn: () => vehiclesApi.assign((vehicle as Vehicle).id, driverId),
        onSuccess: () => onDone((vehicle as Vehicle).licensePlate),
        onError: (err) => setError(getErrorMessage(err, 'The driver could not be assigned. Try again.')),
    });

    return (
        <Modal open={!!vehicle} onClose={onClose} title={`Assign a driver to ${vehicle?.licensePlate ?? ''}`}>
            {drivers.length === 0 ? (
                <p className="body-6 text-fg-muted">
                    There are no drivers in your organization yet. Share your join code or send an invitation first.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    <Field id="driver" label="Driver">
                        <select id="driver" className={SELECT} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                            <option value="">Choose a driver</option>
                            {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {memberLabel(d)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <FormError text={error} />
                    <div className="flex gap-2">
                        <Button disabled={!driverId || assign.isPending} onClick={() => assign.mutate()}>
                            {assign.isPending ? 'Assigning' : 'Assign driver'}
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

/* Update insurance */
export function InsuranceDialog({
    vehicle,
    onClose,
    onDone,
}: {
    vehicle: Vehicle | null;
    onClose: () => void;
    onDone: (plate: string) => void;
}) {
    const [value, setValue] = useState(vehicle?.insuranceExpiry?.slice(0, 10) ?? '');
    const [error, setError] = useState('');

    const save = useMutation({
        mutationFn: () => vehiclesApi.setInsurance((vehicle as Vehicle).id, value),
        onSuccess: () => onDone((vehicle as Vehicle).licensePlate),
        onError: (err) => setError(getErrorMessage(err, 'The insurance date could not be saved. Try again.')),
    });

    const submit = () => {
        if (!value) return setError('Choose the new expiry date.');
        if (value < todayIso()) return setError('This date is in the past. Enter the new expiry date.');
        setError('');
        save.mutate();
    };

    return (
        <Modal open={!!vehicle} onClose={onClose} title={`Insurance for ${vehicle?.licensePlate ?? ''}`}>
            <div className="flex flex-col gap-4">
                <Field id="insurance" label="New expiry date">
                    <Input id="insurance" type="date" value={value} onChange={(e) => setValue(e.target.value)} />
                </Field>
                <FormError text={error} />
                <div className="flex gap-2">
                    <Button disabled={save.isPending} onClick={submit}>
                        {save.isPending ? 'Saving' : 'Save date'}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}