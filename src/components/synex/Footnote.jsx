import { cn } from '@/lib/utils';

export function Footnote({ children, className }) {
  return (
    <sup className={cn('font-mono text-[10px] text-accent ml-0.5', className)}>{children}</sup>
  );
}

export function Footnotes({ children, className }) {
  return (
    <div className={cn('font-mono text-[11px] text-ink-3 leading-relaxed space-y-1', className)}>
      {children}
    </div>
  );
}
