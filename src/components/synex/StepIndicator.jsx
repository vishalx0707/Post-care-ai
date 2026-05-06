import { cn } from '@/lib/utils';

const pad = (n) => String(n).padStart(2, '0');

export function StepIndicator({ current, total, className }) {
  return (
    <span className={cn('font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3', className)}>
      <span className="text-ink">{pad(current)}</span>
      <span className="mx-1">/</span>
      <span>{pad(total)}</span>
    </span>
  );
}
