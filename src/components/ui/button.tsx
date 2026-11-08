import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg border transition-[transform,background-color,opacity] duration-300 ease-brand active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-fg bg-fg text-surface-0 hover:bg-fg-muted hover:border-fg-muted',
        secondary: 'border-surface-5 bg-surface-4 text-fg hover:bg-surface-5',
        ghost: 'border-transparent bg-transparent text-fg hover:bg-surface-4',
      },
      size: {
        sm: 'button-sm px-3 py-2',
        md: 'button-md px-3 py-2',
        lg: 'button-lg px-4 py-3',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';
// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
