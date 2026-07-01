import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500',
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = 'Select';

export { Select };
