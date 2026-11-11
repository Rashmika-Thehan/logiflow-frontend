import { Plus } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/api/client';
import { memberLabel, usersApi } from '@/api/users.api';
import { vehiclesApi } from '@/api/vehicles.api';
import { AddVehicleDialog, AssignDriverDialog, InsuranceDialog } from '@/components/dashboard/VehicleDialogs';
import { PageShell } from '@/components/dashboard/PageShell';
import { VehicleCard } from '@/components/dashboard/VehicleCard';
import { Button } from '@/components/ui/button';
import { asArray } from '@/lib/array';
import { useAuthStore } from '@/stores/authStore';
import type { Vehicle } from '@/types';

type Notice = { tone: 'ok' | 'error'; text: string };

export default function Vehicles() {
    const role = useAuthStore((s) => s.user?.role);
    const queryClient = useQueryClient();
    const [addOpen, setAddOpen] = useState(false);
    const [assigning, setAssigning] = useState<Vehicle | null>(null);
    const [insuring, setInsuring] = useState<Vehicle | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(t);
    }, [notice]);

    const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: vehiclesApi.list });
    const team = useQuery({ queryKey: ['team'], queryFn: usersApi.list });

    const vehicles = useMemo(() => asArray(vehiclesQuery.data), [vehiclesQuery.data]);
    const drivers = useMemo(() => asArray(team.data).filter((u) => u.role === 'DRIVER'), [team.data]);
    const driverName = (id?: string) => {
        if (!id) return null;
        const d = drivers.find((x) => x.id === id);
        return d ? memberLabel(d) : `Driver ${id.slice(0, 8)}`;
    };

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    const done = (text: string) => {
        setNotice({ tone: 'ok', text });
        void refresh();
    };

    const toggle = useMutation({
        mutationFn: (v: Vehicle) =>
            vehiclesApi.setMaintenance(v.id, v.maintenanceState === 'IN_MAINTENANCE' ? 'OPERATIONAL' : 'IN_MAINTENANCE'),
        onSuccess: (_r, v) =>
            done(
                v.maintenanceState === 'IN_MAINTENANCE'
                    ? `${v.licensePlate} is back in service.`
                    : `${v.licensePlate} was sent to maintenance and will not receive jobs.`,
            ),
        onError: (err) =>
            setNotice({ tone: 'error', text: getErrorMessage(err, 'The maintenance status could not be changed. Try again.') }),
    });

    return (
        <PageShell
            title="Fleet"
            actions={
                role === 'BUSINESS_ADMIN' && (
                    <Button onClick={() => setAddOpen(true)}>
                        <Plus size={16} aria-hidden="true" />
                        Add vehicle
                    </Button>
                )
            }
        >
            {notice && (
                <p
                    role="status"
                    className={`body-5 rounded-lg border border-surface-5 bg-surface-3 px-3 py-2 ${notice.tone === 'error' ? 'text-status-urgent' : 'text-status-available'}`}
                >
                    {notice.text}
                </p>
            )}

            {vehiclesQuery.isError ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                    <p className="title-3">Vehicles could not be loaded</p>
                    <p className="body-6 text-fg-muted">Check your connection and try again.</p>
                    <Button variant="secondary" onClick={() => void vehiclesQuery.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : vehiclesQuery.isPending ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading vehicles">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-56 rounded-2xl bg-surface-3" />
                    ))}
                </div>
            ) : vehicles.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-surface-5 bg-surface-2 p-6">
                    <p className="title-3">No vehicles yet</p>
                    <p className="body-6 text-fg-muted">
                        {role === 'BUSINESS_ADMIN'
                            ? 'Add your first vehicle so drivers can be matched to jobs by capacity.'
                            : 'Ask an administrator to add the fleet vehicles.'}
                    </p>
                    {role === 'BUSINESS_ADMIN' && <Button onClick={() => setAddOpen(true)}>Add vehicle</Button>}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {vehicles.map((v) => (
                        <VehicleCard
                            key={v.id}
                            vehicle={v}
                            driverLabel={driverName(v.assignedDriverId)}
                            busy={toggle.isPending && toggle.variables?.id === v.id}
                            onToggleMaintenance={() => toggle.mutate(v)}
                            onAssign={() => setAssigning(v)}
                            onInsurance={() => setInsuring(v)}
                        />
                    ))}
                </div>
            )}

            {addOpen && (
                <AddVehicleDialog
                    open
                    onClose={() => setAddOpen(false)}
                    onDone={(plate) => {
                        setAddOpen(false);
                        done(`${plate} was added to the fleet.`);
                    }}
                />
            )}
            <AssignDriverDialog
                key={assigning?.id ?? 'assign'}
                vehicle={assigning}
                drivers={drivers}
                onClose={() => setAssigning(null)}
                onDone={(plate) => {
                    setAssigning(null);
                    done(`A driver was assigned to ${plate}.`);
                }}
            />
            <InsuranceDialog
                key={insuring?.id ?? 'insurance'}
                vehicle={insuring}
                onClose={() => setInsuring(null)}
                onDone={(plate) => {
                    setInsuring(null);
                    done(`Insurance for ${plate} was updated.`);
                }}
            />
        </PageShell>
    );
}