import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, NavigationArrow, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { branchesApi, type CreateBranchInput } from '@/api/org.api';
import { getErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import type { Branch } from '@/types';

const branchSchema = z.object({
  name: z.string().trim().min(2, 'Enter a depot name.'),
  address: z.string().trim().min(5, 'Enter the depot address.'),
  latitude: z.number({ message: 'Enter a valid latitude (-90 to 90).' }).min(-90).max(90),
  longitude: z.number({ message: 'Enter a valid longitude (-180 to 180).' }).min(-180).max(180),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof branchSchema>;

export function BranchesTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: branches = [], isPending, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['branches'] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      setDeletingBranch(null);
      void invalidate();
    },
    onError: (err) => setErrorMsg(getErrorMessage(err, 'Failed to delete branch.')),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => branchesApi.setDefault(id),
    onSuccess: () => void invalidate(),
    onError: (err) => setErrorMsg(getErrorMessage(err, 'Failed to set the default pickup branch.')),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-5">Depot Branches</h2>
          <p className="body-6 text-fg-muted">
            Configure pickup hubs. Batch imports use the branch marked as the default.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={18} aria-hidden="true" />
          Add Depot
        </Button>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl border border-status-urgent/40 bg-status-urgent/10 p-3 text-status-urgent body-6">
          {errorMsg}
        </div>
      )}

      {isPending ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-full rounded-2xl border border-surface-5 bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <p className="body-5 text-status-urgent">Could not load depots. Check your connection and try again.</p>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-5 p-12 text-center">
          <MapPin size={36} className="text-fg-muted" aria-hidden="true" />
          <div>
            <p className="title-2">No depot branches added yet</p>
            <p className="body-6 text-fg-muted">Add your primary warehouse or fulfillment center to begin dispatching.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} variant="secondary" className="gap-2">
            <Plus size={16} />
            Add Depot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {branches.map((b) => (
            <div
              key={b.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-surface-5 bg-surface-2 p-5 transition-colors hover:border-surface-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-5 bg-surface-3 text-fg">
                    <MapPin size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="title-2">{b.name}</h3>
                      {b.isDefault && <span className="rounded-full bg-status-available/10 px-2 py-0.5 caption-2 text-status-available">Default for imports</span>}
                    </div>
                    <p className="body-6 text-fg-muted">{b.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingBranch(b)}
                    aria-label={`Edit ${b.name}`}
                    className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-4 hover:text-fg"
                  >
                    <PencilSimple size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingBranch(b)}
                    disabled={b.isDefault}
                    title={b.isDefault ? 'Select another default before deleting this branch' : `Delete ${b.name}`}
                    aria-label={`Delete ${b.name}`}
                    className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-4 hover:text-status-urgent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-surface-5 pt-3 caption-1 text-fg-muted">
                <span>Coordinates: {b.latitude != null && b.longitude != null ? `${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)}` : 'Missing — update before selecting as a pickup branch'}</span>
                {b.phone && <span>• Phone: {b.phone}</span>}
                {!b.isDefault && (
                  <Button size="sm" variant="secondary" disabled={defaultMutation.isPending || b.latitude == null || b.longitude == null} onClick={() => defaultMutation.mutate(b.id)}>
                    Set as import default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <BranchFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Depot Branch"
        onSubmitSuccess={() => {
          setCreateOpen(false);
          void invalidate();
        }}
      />

      {/* Edit Modal */}
      {editingBranch && (
        <BranchFormModal
          open={!!editingBranch}
          onClose={() => setEditingBranch(null)}
          title="Edit Depot Branch"
          initialData={editingBranch}
          onSubmitSuccess={() => {
            setEditingBranch(null);
            void invalidate();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deletingBranch} onClose={() => setDeletingBranch(null)} title="Delete Depot Branch">
        <div className="flex flex-col gap-4">
          <p className="body-5">
            Are you sure you want to remove <strong className="text-fg">{deletingBranch?.name}</strong>?
            Any upcoming dispatches assigned to this depot will need to be reallocated.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeletingBranch(null)}>Cancel</Button>
            <Button
              variant="ghost"
              className="text-status-urgent border-status-urgent/40 hover:bg-status-urgent/10"
              disabled={deleteMutation.isPending}
              onClick={() => deletingBranch && deleteMutation.mutate(deletingBranch.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Depot'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BranchFormModal({
  open,
  onClose,
  title,
  initialData,
  onSubmitSuccess,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialData?: Branch;
  onSubmitSuccess: () => void;
}) {
  const [geoError, setGeoError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          address: initialData.address,
          latitude: initialData.latitude ?? undefined,
          longitude: initialData.longitude ?? undefined,
          phone: initialData.phone || '',
        }
      : undefined,
  });

  const handleGeoLocate = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', Number(pos.coords.latitude.toFixed(6)), { shouldValidate: true });
        setValue('longitude', Number(pos.coords.longitude.toFixed(6)), { shouldValidate: true });
      },
      () => setGeoError('Location access was denied. Please enter coordinates manually.'),
    );
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError('');
    try {
      const payload: CreateBranchInput = {
        name: values.name,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        phone: values.phone?.trim() || undefined,
      };

      if (initialData) {
        await branchesApi.update(initialData.id, payload);
      } else {
        await branchesApi.create(payload);
      }
      onSubmitSuccess();
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Failed to save depot.'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {submitError && (
          <p role="alert" className="caption-2 text-status-urgent">
            {submitError}
          </p>
        )}

        <Field id="branch-name" label="Depot Name" error={errors.name?.message}>
          <Input id="branch-name" placeholder="e.g. Central Sorting Hub" {...register('name')} />
        </Field>

        <Field id="branch-address" label="Address" error={errors.address?.message}>
          <Input id="branch-address" placeholder="123 Warehouse Rd, City" {...register('address')} />
        </Field>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="caption-1">Location Coordinates</span>
            <button
              type="button"
              onClick={handleGeoLocate}
              className="inline-flex items-center gap-1.5 caption-1 text-fg hover:underline"
            >
              <NavigationArrow size={14} />
              Use my location
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field id="branch-lat" label="Latitude" error={errors.latitude?.message}>
              <Input
                id="branch-lat"
                type="number"
                step="any"
                placeholder="40.7128"
                {...register('latitude', { valueAsNumber: true })}
              />
            </Field>
            <Field id="branch-lng" label="Longitude" error={errors.longitude?.message}>
              <Input
                id="branch-lng"
                type="number"
                step="any"
                placeholder="-74.0060"
                {...register('longitude', { valueAsNumber: true })}
              />
            </Field>
          </div>
          {geoError && <p className="caption-2 text-status-urgent">{geoError}</p>}
        </div>

        <Field id="branch-phone" label="Phone (optional)" error={errors.phone?.message}>
          <Input id="branch-phone" placeholder="+1 555 123 4567" {...register('phone')} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Depot' : 'Add Depot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
