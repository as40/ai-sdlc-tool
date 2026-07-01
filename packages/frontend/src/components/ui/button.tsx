import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-500',
        outline: 'border border-zinc-600 text-zinc-300 hover:border-zinc-400',
        destructive: 'border border-red-800 text-red-400 hover:border-red-600',
        ghost: 'text-zinc-400 hover:text-zinc-200',
        warning: 'bg-yellow-600/80 text-zinc-950 hover:bg-yellow-500',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'px-2 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
