import { cn } from '@/lib/utils';

export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-blue-100/50 dark:[&_tr]:border-blue-900/30', className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b border-blue-100/40 dark:border-blue-900/20 transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-900/20', className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return (
    <th className={cn('h-12 px-4 text-left align-middle font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider', className)} {...props} />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn('p-4 align-middle text-slate-700 dark:text-slate-300', className)} {...props} />;
}
