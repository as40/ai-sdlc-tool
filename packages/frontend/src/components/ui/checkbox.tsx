import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn('h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-indigo-500', className)}
    {...props}
  />
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
