import { cn } from '../../lib/utils';

interface Props {
  variant?: 'error' | 'success';
  className?: string;
  children: React.ReactNode;
}

export function FormMessage({ variant = 'error', className, children }: Props) {
  return (
    <p
      className={cn('text-xs', variant === 'error' ? 'text-red-400' : 'text-green-400', className)}
    >
      {children}
    </p>
  );
}
