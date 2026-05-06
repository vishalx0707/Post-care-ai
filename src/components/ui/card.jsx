import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn('bg-paper', className)} {...props} />;
});

const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
);
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('font-serif text-2xl text-ink', className)} {...props} />
);
const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-ink-3', className)} {...props} />
);
const CardContent = ({ className, ...props }) => (
  <div className={cn('', className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
