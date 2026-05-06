'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(function Input(
  { className, type = 'text', variant = 'underline', ...props },
  ref,
) {
  const base = 'w-full bg-transparent text-ink placeholder:text-ink-3 disabled:opacity-50 focus:outline-none transition-colors duration-200';
  const variants = {
    underline: 'border-0 border-b border-rule rounded-none px-0 py-2 focus:border-ink',
    boxed: 'border border-rule rounded-md px-3 py-2 focus:border-ink',
  };
  return (
    <input
      ref={ref}
      type={type}
      className={cn(base, variants[variant] || variants.underline, className)}
      {...props}
    />
  );
});

export { Input };
