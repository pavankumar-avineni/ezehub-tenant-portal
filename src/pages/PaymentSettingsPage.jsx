import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, QrCode, Building2, Save } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PaymentSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    paymentUpiId: '',
    paymentQrUrl: '',
    paymentBankName: '',
    paymentAccountNumber: '',
    paymentIfscCode: '',
    paymentAccountHolder: '',
    paymentInstructions: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => (await api.get('/tenant/settings/payment')).data.data,
  });

  useEffect(() => {
    if (data) {
      setForm({
        paymentUpiId: data.paymentUpiId || '',
        paymentQrUrl: data.paymentQrUrl || '',
        paymentBankName: data.paymentBankName || '',
        paymentAccountNumber: data.paymentAccountNumber || '',
        paymentIfscCode: data.paymentIfscCode || '',
        paymentAccountHolder: data.paymentAccountHolder || '',
        paymentInstructions: data.paymentInstructions || '',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings) => api.put('/tenant/settings/payment', settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-settings'] }),
  });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (isLoading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader title="Payment Settings" description="Configure how residents pay rent — these details are shown in the resident mobile app" />

      <div className="grid gap-6 md:grid-cols-2">
        {/* UPI Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">UPI Details</h3>
              <p className="text-xs text-slate-500">Residents will see this UPI ID in the app</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>UPI ID</Label>
              <Input value={form.paymentUpiId} onChange={handleChange('paymentUpiId')} placeholder="yourname@upi" />
            </div>
            <div>
              <Label>QR Code Image URL</Label>
              <Input value={form.paymentQrUrl} onChange={handleChange('paymentQrUrl')} placeholder="https://... (Cloudinary URL or any image URL)" />
              <p className="text-xs text-slate-500 mt-1">Upload your payment QR to Cloudinary and paste the URL here</p>
            </div>
          </div>
        </div>

        {/* Bank Account Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Bank Account</h3>
              <p className="text-xs text-slate-500">For bank transfer payments</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Account Holder Name</Label>
              <Input value={form.paymentAccountHolder} onChange={handleChange('paymentAccountHolder')} placeholder="John Doe" />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input value={form.paymentBankName} onChange={handleChange('paymentBankName')} placeholder="HDFC Bank" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={form.paymentAccountNumber} onChange={handleChange('paymentAccountNumber')} placeholder="1234567890" />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input value={form.paymentIfscCode} onChange={handleChange('paymentIfscCode')} placeholder="HDFC0001234" />
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="glass-card p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Payment Instructions</h3>
              <p className="text-xs text-slate-500">Custom message shown to residents before they pay</p>
            </div>
          </div>
          <div>
            <Label>Instructions</Label>
            <textarea
              className="flex w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              value={form.paymentInstructions}
              onChange={handleChange('paymentInstructions')}
              placeholder="Pay using any UPI app (GPay, PhonePe, Paytm) and submit proof in the app. Include your name in the payment note."
            />
          </div>
        </div>
      </div>

      {/* Preview & Save */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {form.paymentUpiId && <span className="mr-4">UPI: <strong>{form.paymentUpiId}</strong></span>}
          {form.paymentBankName && <span>Bank: <strong>{form.paymentBankName} - {form.paymentAccountNumber}</strong></span>}
        </p>
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="px-8">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <div className="mt-4 glass-card p-4 border-l-4 border-l-emerald-500">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Settings saved. Residents will see these details in the mobile app.</p>
        </div>
      )}
    </div>
  );
}
