'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
      {...props}
    />
  );
});

const SheetContent = React.forwardRef(function SheetContent({ side = 'left', className, children, ...props }, ref) {
  const sides = {
    left: 'inset-y-0 left-0 h-full w-72 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
    right: 'inset-y-0 right-0 h-full w-72 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  };
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn('fixed z-50 bg-paper border-rule shadow-xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300', sides[side], className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 text-ink-3 hover:text-ink transition-colors">
          <X size={16} strokeWidth={1.5} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

export { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent };
