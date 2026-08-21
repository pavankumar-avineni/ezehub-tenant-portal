import { cn, getStatusColor } from '@/lib/utils';

export function Badge({ className, variant = 'default', ...props }) {
  const variants = {
    default: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30',
    secondary: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/30',
    outline: 'border border-blue-200/50 dark:border-blue-800/30 text-slate-600 dark:text-slate-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold', getStatusColor(status))}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
