import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Clock, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function SubscriptionPage() {
  const [payDialog, setPayDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => (await api.get('/subscription/my')).data.data,
  });

  const payMutation = useMutation({
    mutationFn: async ({ invoiceId, transactionId, file }) => {
      const formData = new FormData();
      formData.append('transactionId', transactionId);
      formData.append('paymentMethod', 'UPI');
      if (file) formData.append('proof', file);
      return api.post(`/subscription/my/pay/${invoiceId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      setPayDialog(false);
      setTransactionId('');
      setProofFile(null);
    },
  });

  const sub = data?.subscription;
  const invoices = data?.invoices || [];
  const pendingInvoice = invoices.find(i => i.status === 'PENDING');

  return (
    <div>
      <PageHeader title="Subscription" description="Manage your plan and billing" />

      {/* Status Cards */}
      {sub && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <StatCard title="Current Plan" value={sub.plan} icon={CreditCard} />
          <StatCard title="Status" value={sub.status} icon={sub.isExpiringSoon ? AlertTriangle : CheckCircle} />
          <StatCard title="Days Left" value={sub.daysLeft} icon={Clock} />
          <StatCard title="Price" value={formatCurrency(sub.price)} icon={CreditCard} />
        </div>
      )}

      {/* Expiry Warning */}
      {sub?.isExpiringSoon && (
        <div className="glass-card p-4 mb-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Your subscription expires in {sub.daysLeft} days. Please renew to continue uninterrupted access.</p>
          </div>
        </div>
      )}

      {sub?.isExpired && (
        <div className="glass-card p-4 mb-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Your subscription has expired. Renew now to regain full access.</p>
          </div>
        </div>
      )}

      {/* Payment Section */}
      {pendingInvoice && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Pending Payment</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left - Invoice Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Invoice</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{pendingInvoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Amount to Pay</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(pendingInvoice.total)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatDate(pendingInvoice.dueDate)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Plan</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{pendingInvoice.plan}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500">Billing Period</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatDate(pendingInvoice.billingStart)} → {formatDate(pendingInvoice.billingEnd)}</p>
              </div>
              <Button className="w-full h-12 text-base" onClick={() => { setSelectedInvoice(pendingInvoice); setPayDialog(true); }}>
                <Upload className="h-4 w-4" /> I've Paid — Submit Proof
              </Button>
            </div>

            {/* Right - QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700 w-fit">
                <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Scan to Pay</p>
                {data?.payment?.qrUrl ? (
                  <img src={data.payment.qrUrl} alt="Payment QR" className="w-52 h-52 rounded-lg object-contain" />
                ) : (
                  <div className="w-52 h-52 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <p className="text-sm text-slate-400 text-center px-4">QR not configured by admin</p>
                  </div>
                )}
                {data?.payment?.upiId && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase">UPI ID</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 select-all">{data.payment.upiId}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">Pay using any UPI app<br/>(GPay, PhonePe, Paytm)</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Invoice History</h3>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Invoice</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Paid</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : invoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No invoices yet</TableCell></TableRow>
              : invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{inv.invoiceNumber}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{inv.plan}</span></TableCell>
                  <TableCell>{formatCurrency(inv.total)}</TableCell>
                  <TableCell className="text-xs">{formatDate(inv.billingStart)} - {formatDate(inv.billingEnd)}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell>{formatDate(inv.paidAt)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pay Dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Payment Proof</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Pay <span className="font-bold text-slate-800">{formatCurrency(selectedInvoice?.total)}</span> to the UPI ID shown and submit proof below.</p>
            <div className="space-y-2">
              <Label>Transaction ID / UTR Number</Label>
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter UPI transaction ID" />
            </div>
            <div className="space-y-2">
              <Label>Payment Screenshot (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0])} />
            </div>
            {payMutation.error && <p className="text-sm text-red-500">{payMutation.error.response?.data?.message}</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (!transactionId.trim()) return;
              payMutation.mutate({ invoiceId: selectedInvoice.id, transactionId: transactionId.trim(), file: proofFile });
            }} disabled={payMutation.isPending}>
              {payMutation.isPending ? 'Submitting...' : 'Submit Proof'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
