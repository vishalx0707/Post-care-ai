'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('inline-flex items-center gap-6 border-b border-rule', className)}
      {...props}
    />
  );
});

const TabsTrigger = React.forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 pb-3 pt-1 transition-colors hover:text-ink data-[state=active]:text-ink focus-visible:outline-none data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-px data-[state=active]:after:bg-ink',
        className,
      )}
      {...props}
    />
  );
});

const TabsContent = React.forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
