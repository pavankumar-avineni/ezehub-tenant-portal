import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Check, X, Clock, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RentPage() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [rejectDialog, setRejectDialog] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: charges, isLoading } = useQuery({
    queryKey: ['rent-charges'],
    queryFn: async () => (await api.get('/tenant/rent/charges', { params: { limit: 50 } })).data,
  });

  const { data: outstanding } = useQuery({
    queryKey: ['rent-outstanding'],
    queryFn: async () => (await api.get('/tenant/rent/outstanding')).data.data,
  });

  const { data: pendingProofs } = useQuery({
    queryKey: ['pending-payment-proofs'],
    queryFn: async () => (await api.get('/tenant/payments/pending-proofs')).data.data,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/tenant/rent/generate', { month: now.getMonth() + 1, year: now.getFullYear() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rent-charges'] }),
  });

  const confirmMutation = useMutation({
    mutationFn: (paymentId) => api.post(`/tenant/payments/${paymentId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-charges'] });
      queryClient.invalidateQueries({ queryKey: ['rent-outstanding'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ paymentId, reason }) => api.post(`/tenant/payments/${paymentId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-proofs'] });
      setRejectDialog(null);
      setRejectReason('');
    },
  });

  const items = charges?.data || [];

  return (
    <div>
      <PageHeader title="Rent & Payments" description="Generate rent, track collections, confirm resident payments" actions={
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Generate {now.toLocaleString('en-IN', { month: 'long' })} Rent
        </Button>
      } />

      {outstanding && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="glass-card p-6"><p className="text-sm text-slate-500 dark:text-slate-400">Total Outstanding</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(outstanding.totalOutstanding)}</p></div>
          <div className="glass-card p-6"><p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p><p className="text-2xl font-bold text-red-500">{formatCurrency(outstanding.overdueAmount)}</p></div>
          <div className="glass-card p-6"><p className="text-sm text-slate-500 dark:text-slate-400">Residents Due</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{outstanding.residentsWithDue ?? 0}</p></div>
        </div>
      )}

      {/* Pending Payment Proofs from Residents */}
      {pendingProofs && pendingProofs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Payment Proofs ({pendingProofs.length})
          </h3>
          <div className="glass-card overflow-hidden border-l-4 border-l-amber-500">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProofs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-800 dark:text-white">
                      {p.resident?.firstName} {p.resident?.lastName}
                      <p className="text-xs text-slate-500">{p.resident?.phone}</p>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{p.method}</span></TableCell>
                    <TableCell className="text-xs font-mono">{p.transactionId}</TableCell>
                    <TableCell>{p.rentCharge ? `${p.rentCharge.month}/${p.rentCharge.year}` : '-'}</TableCell>
                    <TableCell>
                      {p.paymentProofUrl ? (
                        <a href={p.paymentProofUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> View
                        </a>
                      ) : <span className="text-xs text-slate-400">No image</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Confirm Payment" onClick={() => confirmMutation.mutate(p.id)} disabled={confirmMutation.isPending}>
                          <Check className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Reject Payment" onClick={() => setRejectDialog(p.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Rent Charges Table */}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Rent Charges</h3>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Resident</TableHead><TableHead>Period</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No rent charges. Generate monthly rent to get started.</TableCell></TableRow>
              : items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{c.resident?.firstName} {c.resident?.lastName}</TableCell>
                  <TableCell>{c.month}/{c.year}</TableCell>
                  <TableCell>{formatCurrency(c.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(c.paidAmount)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>{formatDate(c.dueDate)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reason for rejection</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Invalid transaction, amount mismatch..." />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ paymentId: rejectDialog, reason: rejectReason })} disabled={!rejectReason.trim() || rejectMutation.isPending}>
              Reject & Notify Resident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
