'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn('border-b border-rule', className)}
      {...props}
    />
  );
});

const AccordionTrigger = React.forwardRef(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex flex-1 items-center justify-between py-5 font-serif text-lg text-ink transition-all hover:text-ink-2 [&[data-state=open]>svg]:rotate-45',
          className,
        )}
        {...props}
      >
        {children}
        <Plus size={18} strokeWidth={1.5} className="text-ink-3 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className="overflow-hidden text-ink-2 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('pb-5 pt-0 max-w-[60ch] leading-relaxed', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
