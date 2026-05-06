'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 block',
        className,
      )}
      {...props}
    />
  );
});

export { Label };
