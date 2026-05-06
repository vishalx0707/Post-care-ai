import { cn } from '@/lib/utils';

export function Hairline({ label, className, ...props }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)} {...props}>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 shrink-0">{label}</span>
        <div className="flex-1 h-px bg-rule" />
      </div>
    );
  }
  return <div className={cn('h-px w-full bg-rule', className)} {...props} />;
}
