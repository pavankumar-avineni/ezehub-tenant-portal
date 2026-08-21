import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, BedDouble, Users, IndianRupee } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

function DetailField({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function getStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
    case 'PARTIALLY_OCCUPIED': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
    case 'OCCUPIED': case 'FULL': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
    default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
  }
}

export default function RoomsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ buildingId: '', floorId: '', name: '', number: '', capacity: '1', rentAmount: '0' });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: allFloors } = useQuery({
    queryKey: ['floors-all'],
    queryFn: async () => (await api.get('/tenant/floors', { params: { limit: 200 } })).data.data,
  });

  const filteredFloors = useMemo(() => {
    if (!form.buildingId || !allFloors) return allFloors || [];
    return allFloors.filter(f => f.buildingId === form.buildingId);
  }, [form.buildingId, allFloors]);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', search],
    queryFn: async () => (await api.get('/tenant/rooms', { params: { search, limit: 50 } })).data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['room-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/rooms/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/rooms', payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['rooms'] }); 
      setOpen(false);
      setForm({ buildingId: '', floorId: '', name: '', number: '', capacity: '1', rentAmount: '0' });
      setErrors({});
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach(err => { fieldErrors[err.field] = err.message; });
        setErrors(fieldErrors);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenant/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const items = rooms?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      floorId: form.floorId,
      name: form.name.trim(),
      number: form.number.trim(),
      capacity: parseInt(form.capacity, 10),
      rentAmount: parseFloat(form.rentAmount) || 0,
    };
    if (!form.buildingId) { setErrors({ buildingId: 'Please select a building' }); return; }
    if (!payload.floorId) { setErrors({ floorId: 'Please select a floor' }); return; }
    if (!payload.name) { setErrors({ name: 'Room name is required' }); return; }
    if (!payload.number) { setErrors({ number: 'Room number is required' }); return; }
    if (isNaN(payload.capacity) || payload.capacity < 1) { setErrors({ capacity: 'Capacity must be at least 1' }); return; }
    createMutation.mutate(payload);
  };

  const handleCardClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Rooms" description="Manage rooms within floors" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Room</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Room</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Building</Label>
                  <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" value={form.buildingId} onChange={(e) => setForm({ ...form, buildingId: e.target.value, floorId: '' })}>
                    <option value="">Select building</option>
                    {(buildings || []).map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                  {errors.buildingId && <p className="text-sm text-red-500">{errors.buildingId}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Floor</Label>
                  <Select value={form.floorId} onValueChange={(value) => setForm({ ...form, floorId: value })} disabled={!form.buildingId}>
                    <SelectTrigger><SelectValue placeholder={form.buildingId ? "Select floor" : "Select a building first"} /></SelectTrigger>
                    <SelectContent>{filteredFloors.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name} (Floor {f.number})</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.floorId && <p className="text-sm text-red-500">{errors.floorId}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Room 101" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="101" />
                  {errors.number && <p className="text-sm text-red-500">{errors.number}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Capacity (Beds)</Label>
                  <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                  {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Rent Amount (₹)</Label>
                  <Input type="number" min="0" step="100" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} />
                </div>
              </div>
              {createMutation.error && Object.keys(errors).length === 0 && (
                <p className="text-sm text-red-500">{createMutation.error.response?.data?.message || 'Failed to create room'}</p>
              )}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>Create Room</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No rooms yet. Create a floor first.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((r) => (
            <div
              key={r.id}
              onClick={() => handleCardClick(r.id)}
              className="glass-card p-4 cursor-pointer hover:scale-[1.02] transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 relative"
            >
              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(r.id); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
              </Button>

              {/* Room name & number */}
              <div className="mb-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">{r.name}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">#{r.number}</span>
              </div>

              {/* Building + Floor info */}
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                {r.floor?.building?.name || '-'} • {r.floor?.name || '-'}
              </p>

              {/* Status badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold border ${getStatusColor(r.status)}`}>
                  {r.status?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1" title="Capacity">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.capacity}</span>
                </div>
                <div className="flex items-center gap-1" title="Rent">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.rentAmount}</span>
                </div>
                <div className="flex items-center gap-1" title="Beds">
                  <BedDouble className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{r._count?.beds ?? 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Room Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Location</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Building" value={detailData.floor?.building?.name} />
                  <DetailField label="Floor" value={detailData.floor?.name} />
                  <DetailField label="Room Name" value={detailData.name} />
                  <DetailField label="Room Number" value={detailData.number} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Capacity" value={detailData.capacity} />
                  <DetailField label="Rent Amount" value={formatCurrency(detailData.rentAmount)} />
                  <DetailField label="Status" value={detailData.status} />
                  <DetailField label="Beds Count" value={detailData._count?.beds ?? detailData.beds?.length ?? 0} />
                </div>
              </div>
              {detailData.beds && detailData.beds.length > 0 && (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Beds</p>
                  <div className="space-y-1">
                    {detailData.beds.map((bed) => (
                      <div key={bed.id} className="flex justify-between items-center text-sm py-1 border-b border-slate-100 dark:border-slate-700/50">
                        <span className="font-medium text-slate-800 dark:text-white">{bed.label}</span>
                        <StatusBadge status={bed.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
