import { cn } from '@/lib/utils';

const sizes = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
};

export function Wordmark({ size = 'md', className, ...props }) {
  return (
    <span
      className={cn(
        'font-serif tracking-tight text-ink inline-flex items-baseline',
        sizes[size] || sizes.md,
        className,
      )}
      {...props}
    >
      Syn
      <span className="italic text-accent">e</span>
      x
    </span>
  );
}
