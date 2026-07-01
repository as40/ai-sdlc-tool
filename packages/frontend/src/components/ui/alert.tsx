import { cn } from '../../lib/utils';

const variants = {
  error: 'border-red-500/40 bg-red-950/30 text-red-400',
  success: 'border-green-500/40 bg-green-950/30 text-green-400',
  warning: 'border-yellow-500/40 bg-yellow-950/30 text-yellow-400',
};

interface Props {
  variant: 'error' | 'success' | 'warning';
  className?: string;
  children: React.ReactNode;
}

export function Alert({ variant, className, children }: Props) {
  return (
    <div
      role="alert"
      className={cn('rounded border px-4 py-3 text-sm', variants[variant], className)}
    >
      {children}
    </div>
  );
}
