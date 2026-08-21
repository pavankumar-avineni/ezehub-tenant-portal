import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
  );
}

export default function VisitorsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ buildingId: '', name: '', phone: '', purpose: '', hostName: '' });
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', search],
    queryFn: async () => (await api.get('/tenant/visitors', { params: { search, limit: 50 } })).data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['visitor-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/visitors/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/visitors', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['visitors'] }); setOpen(false); setForm({ buildingId: '', name: '', phone: '', purpose: '', hostName: '' }); },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, body }) => api.post(`/tenant/visitors/${id}/${action}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visitors'] }),
  });

  const visitors = data?.data || [];

  const handleRowClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Visitors" description="Register, verify, and track visitor entry" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Register Visitor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Visitor</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Building</Label>
                <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })} required>
                  <option value="">Select building</option>
                  {(buildings || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
                <div className="space-y-2 col-span-2"><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required /></div>
                <div className="space-y-2 col-span-2"><Label>Host Name</Label><Input value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} /></div>
              </div>
              {createMutation.error && <p className="text-sm text-red-500">{createMutation.error.response?.data?.message}</p>}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>Register</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="mb-4 relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search visitors..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Purpose</TableHead><TableHead>Host</TableHead><TableHead>Status</TableHead><TableHead>Check-in</TableHead><TableHead className="w-[120px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : visitors.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No visitors registered</TableCell></TableRow>
              : visitors.map((v) => (
                <TableRow key={v.id} className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20" onClick={() => handleRowClick(v.id)}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{v.name}</TableCell>
                  <TableCell>{v.phone}</TableCell>
                  <TableCell>{v.purpose}</TableCell>
                  <TableCell>{v.hostName || '-'}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell>{formatDate(v.checkInAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {v.status === 'OTP_SENT' && (
                        <Button variant="ghost" size="icon" title="Verify OTP" onClick={() => { const otp = prompt('Enter OTP'); if (otp) actionMutation.mutate({ id: v.id, action: 'verify-otp', body: { otp } }); }}>
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                        </Button>
                      )}
                      {['VERIFIED', 'REGISTERED'].includes(v.status) && (
                        <Button variant="ghost" size="icon" title="Check In" onClick={() => actionMutation.mutate({ id: v.id, action: 'check-in' })}><LogIn className="h-4 w-4 text-emerald-500" /></Button>
                      )}
                      {v.status === 'CHECKED_IN' && (
                        <Button variant="ghost" size="icon" title="Check Out" onClick={() => actionMutation.mutate({ id: v.id, action: 'check-out' })}><LogOut className="h-4 w-4 text-amber-500" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Visitor Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Visitor Info</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Name" value={detailData.name} />
                  <DetailField label="Phone" value={detailData.phone} />
                  <DetailField label="Purpose" value={detailData.purpose} />
                  <DetailField label="Host Name" value={detailData.hostName} />
                  <DetailField label="Building" value={detailData.building?.name} />
                  <DetailField label="Status" value={detailData.status} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Timing</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Check-in Time" value={detailData.checkInAt ? new Date(detailData.checkInAt).toLocaleString('en-IN') : null} />
                  <DetailField label="Check-out Time" value={detailData.checkOutAt ? new Date(detailData.checkOutAt).toLocaleString('en-IN') : null} />
                  <DetailField label="OTP Status" value={detailData.otpVerified ? 'Verified' : 'Not Verified'} />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
