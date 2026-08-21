import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root className={cn('text-sm font-medium leading-none text-slate-700 dark:text-slate-300', className)} {...props} />
  );
}
