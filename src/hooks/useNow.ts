import { useEffect, useState } from 'react';

/** Re-renders every `intervalMs` so age based UI, such as stale markers, stays current. */
export function useNow(intervalMs = 15_000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}