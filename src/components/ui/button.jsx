'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper hover:bg-ink-2 rounded-md',
        secondary: 'bg-paper-2 text-ink hover:bg-rule rounded-md',
        outline: 'border border-rule-strong bg-transparent text-ink hover:border-ink rounded-md data-[state=on]:bg-ink data-[state=on]:text-paper data-[state=on]:border-ink',
        ghost: 'bg-transparent text-ink hover:bg-paper-2 rounded-md',
        link: 'bg-transparent text-ink underline underline-offset-4 decoration-rule-strong hover:decoration-ink p-0 h-auto rounded-none',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
