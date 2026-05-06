'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cn } from '@/lib/utils';

const Toggle = React.forwardRef(function Toggle({ className, ...props }, ref) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-rule-strong bg-paper-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-ink data-[state=on]:border-ink',
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none block h-3 w-3 rounded-full bg-paper shadow-sm transition-transform duration-200 translate-x-[2px] data-[state=on]:translate-x-[16px]"
        data-state={props['data-state']}
      />
    </TogglePrimitive.Root>
  );
});

const SwitchToggle = React.forwardRef(function SwitchToggle({ className, pressed, onPressedChange, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={pressed}
      data-state={pressed ? 'on' : 'off'}
      onClick={() => onPressedChange?.(!pressed)}
      className={cn(
        'relative inline-flex h-[20px] w-9 shrink-0 cursor-pointer items-center rounded-full border border-rule-strong bg-paper-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=on]:bg-ink data-[state=on]:border-ink',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-3.5 w-3.5 rounded-full bg-paper shadow-sm transition-transform duration-200',
          pressed ? 'translate-x-[18px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );
});

export { Toggle, SwitchToggle };
