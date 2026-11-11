import { X } from '@phosphor-icons/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/** Built on the native <dialog>: focus trap, Escape to close and a backdrop come with it. */
export function Modal({ open, onClose, title, children }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
            className="m-auto w-full max-w-lg rounded-2xl border border-surface-5 bg-surface-2 p-0 text-fg backdrop:bg-surface-0/80"
        >
            {open && (
                <div className="flex max-h-[90vh] flex-col gap-6 overflow-y-auto p-6">
                    <div className="flex items-start justify-between gap-4">
                        <h2 id={titleId} className="heading-5">
                            {title}
                        </h2>
                        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-surface-4">
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                    {children}
                </div>
            )}
        </dialog>
    );
}