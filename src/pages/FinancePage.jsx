import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FinancePage() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: async () => (await api.get('/tenant/finance/dashboard')).data.data,
  });

  const { data: income } = useQuery({
    queryKey: ['finance-income'],
    queryFn: async () => (await api.get('/tenant/finance/income', { params: { limit: 20 } })).data,
  });

  const { data: expenses } = useQuery({
    queryKey: ['finance-expenses'],
    queryFn: async () => (await api.get('/tenant/finance/expenses', { params: { limit: 20 } })).data,
  });

  return (
    <div>
      <PageHeader title="Finance" description="Income, expenses, and financial overview" />
      {dashLoading ? (
        <div className="grid gap-4 md:grid-cols-4 mb-8">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl glass-card animate-pulse shimmer-glass" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard title="Total Income" value={formatCurrency(dashboard?.totalIncome)} icon={TrendingUp} />
          <StatCard title="Total Expenses" value={formatCurrency(dashboard?.totalExpenses)} icon={TrendingDown} />
          <StatCard title="Net Balance" value={formatCurrency(dashboard?.netBalance)} />
          <StatCard title="This Month" value={formatCurrency(dashboard?.monthlyIncome)} subtitle={`Expenses: ${formatCurrency(dashboard?.monthlyExpenses)}`} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card overflow-hidden">
          <h3 className="p-4 font-semibold text-slate-800 dark:text-white border-b border-blue-100/50 dark:border-blue-900/30">Recent Income</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(income?.data || []).length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-400">No income records</TableCell></TableRow>
                : income.data.map((r) => (
                  <TableRow key={r.id}><TableCell>{r.description}</TableCell><TableCell className="text-emerald-600 font-semibold">{formatCurrency(r.amount)}</TableCell><TableCell>{formatDate(r.date)}</TableCell></TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <div className="glass-card overflow-hidden">
          <h3 className="p-4 font-semibold text-slate-800 dark:text-white border-b border-blue-100/50 dark:border-blue-900/30">Recent Expenses</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(expenses?.data || []).length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-6 text-slate-400">No expense records</TableCell></TableRow>
                : expenses.data.map((r) => (
                  <TableRow key={r.id}><TableCell>{r.description}</TableCell><TableCell className="text-red-500 font-semibold">{formatCurrency(r.amount)}</TableCell><TableCell>{formatDate(r.date)}</TableCell></TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
