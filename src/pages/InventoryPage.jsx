import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ buildingId: '', name: '', category: '', uniqueCode: '', condition: 'NEW', purchasePrice: '' });
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search],
    queryFn: async () => (await api.get('/tenant/inventory', { params: { search, limit: 50 } })).data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['inventory-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/inventory/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/inventory', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setOpen(false); setForm({ buildingId: '', name: '', category: '', uniqueCode: '', condition: 'NEW', purchasePrice: '' }); },
  });

  const items = data?.data || [];

  const handleRowClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Inventory" description="Track assets across buildings and rooms" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined }); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Building</Label>
                <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value })} required>
                  <option value="">Select building</option>
                  {(buildings || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Unique Code</Label><Input value={form.uniqueCode} onChange={(e) => setForm({ ...form, uniqueCode: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Condition</Label>
                  <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    {['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2 col-span-2"><Label>Purchase Price</Label><Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></div>
              </div>
              {createMutation.error && <p className="text-sm text-red-500">{createMutation.error.response?.data?.message}</p>}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>Add Item</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="mb-4 relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input className="pl-9" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Category</TableHead><TableHead>Building</TableHead><TableHead>Condition</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No inventory items</TableCell></TableRow>
              : items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20" onClick={() => handleRowClick(item.id)}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{item.name}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{item.uniqueCode}</span></TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.building?.name || '-'}</TableCell>
                  <TableCell><StatusBadge status={item.condition} /></TableCell>
                  <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Inventory Item Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Item Info</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Name" value={detailData.name} />
                  <DetailField label="Unique Code" value={detailData.uniqueCode} />
                  <DetailField label="Category" value={detailData.category} />
                  <DetailField label="Condition" value={detailData.condition} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Location</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Building" value={detailData.building?.name} />
                  <DetailField label="Room" value={detailData.room?.name} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Purchase</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Purchase Price" value={formatCurrency(detailData.purchasePrice)} />
                  <DetailField label="Purchase Date" value={formatDate(detailData.purchaseDate)} />
                </div>
              </div>
              {detailData.notes && (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detailData.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
