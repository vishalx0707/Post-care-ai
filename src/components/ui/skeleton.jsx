import { cn } from '@/lib/utils';

export function Skeleton({ className, width, height = '1px', ...props }) {
  return (
    <div
      className={cn('synex-hairline-pulse bg-rule-strong', className)}
      style={{ width, height }}
      {...props}
    />
  );
}
