import type { ReactNode } from 'react';

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="caption-1">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" className="caption-2 text-status-urgent">
                    {error}
                </p>
            )}
        </div>
    );
}