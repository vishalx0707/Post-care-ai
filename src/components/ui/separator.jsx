import { cn } from '@/lib/utils';

export function Separator({ orientation = 'horizontal', className, ...props }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'bg-rule shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full',
        className,
      )}
      {...props}
    />
  );
}
