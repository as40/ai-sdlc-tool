import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-zinc-500',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
