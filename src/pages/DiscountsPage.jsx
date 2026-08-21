import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Percent, DollarSign, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DiscountsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'FLAT', value: '', scope: 'ALL_RESIDENTS', category: 'GENERAL', startDate: '', endDate: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: async () => (await api.get('/tenant/discounts', { params: { limit: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/discounts', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['discounts'] }); setShowCreate(false); setForm({ name: '', description: '', type: 'FLAT', value: '', scope: 'ALL_RESIDENTS', category: 'GENERAL', startDate: '', endDate: '' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenant/discounts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discounts'] }),
  });

  const items = data?.data || [];

  return (
    <div>
      <PageHeader title="Discounts" description="Manage rent discounts for residents" actions={
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Discount</Button>
      } />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Scope</TableHead><TableHead>Category</TableHead><TableHead>Valid</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">No discounts yet</TableCell></TableRow>
              : items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{d.name}</TableCell>
                  <TableCell>{d.type === 'FLAT' ? <DollarSign className="h-4 w-4 inline" /> : <Percent className="h-4 w-4 inline" />} {d.type}</TableCell>
                  <TableCell className="font-bold">{d.type === 'FLAT' ? formatCurrency(d.value) : `${d.value}%`}</TableCell>
                  <TableCell><span className="text-xs">{d.scope?.replace(/_/g, ' ')}</span></TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell className="text-xs">{formatDate(d.startDate)} — {d.endDate ? formatDate(d.endDate) : '∞'}</TableCell>
                  <TableCell><StatusBadge status={d.isActive ? 'ACTIVE' : 'INACTIVE'} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this discount?')) deleteMutation.mutate(d.id); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Discount</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Early Bird Discount" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off for early payment" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><select className="w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-slate-800" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="FLAT">Flat (₹)</option><option value="PERCENTAGE">Percentage (%)</option></select></div>
              <div><Label>Value</Label><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'FLAT' ? '500' : '10'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Scope</Label><select className="w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-slate-800" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}><option value="ALL_RESIDENTS">All Residents</option><option value="SPECIFIC_BUILDINGS">Specific Buildings</option><option value="SPECIFIC_RESIDENTS">Specific Residents</option></select></div>
              <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="GENERAL, EARLY_PAYMENT, REFERRAL" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date (optional)</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate({ ...form, value: parseFloat(form.value) })} disabled={!form.name || !form.value || !form.startDate}>
              {createMutation.isPending ? 'Creating...' : 'Create Discount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
