import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'body-5 w-full rounded-lg border border-surface-5 bg-surface-3 px-3 py-2 text-fg placeholder:text-fg-muted transition-colors duration-300 ease-brand focus-visible:border-fg aria-[invalid=true]:border-status-urgent',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
