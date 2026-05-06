import { cn } from '@/lib/utils';

export function Eyebrow({ className, children, ...props }) {
  return (
    <span
      className={cn('font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 block', className)}
      {...props}
    >
      {children}
    </span>
  );
}
