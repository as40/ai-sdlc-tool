import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-50 outline-none focus:border-zinc-500',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Textarea };
