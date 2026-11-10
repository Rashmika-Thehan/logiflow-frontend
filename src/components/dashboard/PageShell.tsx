import type { ReactNode } from 'react';

/** Standard padded page for dashboard screens that are not full bleed (the map is). */
export function PageShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="heading-4">{title}</h1>
                {actions}
            </div>
            {children}
        </div>
    );
}