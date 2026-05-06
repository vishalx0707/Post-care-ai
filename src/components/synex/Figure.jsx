import { cn } from '@/lib/utils';

export function Figure({ number, caption, children, reverse = false, className, ...props }) {
  return (
    <div className={cn('grid md:grid-cols-2 gap-12 md:gap-20 items-center py-16 border-t border-rule', className)} {...props}>
      <div className={reverse ? 'md:order-2' : ''}>
        {number && (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 block mb-4">
            {number}
          </span>
        )}
        {caption}
      </div>
      <div className={cn('relative', reverse ? 'md:order-1' : '')}>
        {children}
      </div>
    </div>
  );
}
