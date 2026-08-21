import { cn } from '@/lib/utils';

export function StatCard({ title, value, subtitle, icon: Icon, className }) {
  return (
    <div className={cn('glass-card p-6 animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}
