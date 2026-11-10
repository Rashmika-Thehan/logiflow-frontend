import { useState } from 'react';
import { LiveFleetMap } from '@/components/map/LiveFleetMap';

export default function FleetMap() {
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <div className="h-screen">
            <LiveFleetMap selectedId={selected} onSelect={setSelected} />
        </div>
    );
}