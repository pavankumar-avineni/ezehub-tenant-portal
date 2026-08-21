import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
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

function getBedColor(bed) {
  if (bed.status === 'AVAILABLE') return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600';
  if (bed.status === 'MAINTENANCE') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600';
  // Occupied — check gender of resident
  const gender = bed.residents?.[0]?.gender;
  if (gender === 'MALE') return 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600';
  if (gender === 'FEMALE') return 'bg-pink-100 dark:bg-pink-900/40 border-pink-400 dark:border-pink-600';
  return 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 dark:border-purple-600';
}

function getBedTextColor(bed) {
  if (bed.status === 'AVAILABLE') return 'text-slate-500 dark:text-slate-400';
  if (bed.status === 'MAINTENANCE') return 'text-yellow-700 dark:text-yellow-300';
  const gender = bed.residents?.[0]?.gender;
  if (gender === 'MALE') return 'text-blue-700 dark:text-blue-300';
  if (gender === 'FEMALE') return 'text-pink-700 dark:text-pink-300';
  return 'text-purple-700 dark:text-purple-300';
}

export default function BedsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ roomId: '', label: '', rentAmount: '0' });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get('/tenant/rooms')).data.data,
  });

  const { data: beds, isLoading } = useQuery({
    queryKey: ['beds', search],
    queryFn: async () => (await api.get('/tenant/beds', { params: { search, limit: 50 } })).data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['bed-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/beds/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/beds', payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['beds'] }); 
      setOpen(false);
      setForm({ roomId: '', label: '', rentAmount: '0' });
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
    mutationFn: (id) => api.delete(`/tenant/beds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds'] }),
  });

  const items = beds?.data || [];

  // Group beds: building → floor → room
  const groupedBeds = useMemo(() => {
    const buildings = {};
    items.forEach((bed) => {
      const buildingName = bed.room?.floor?.building?.name || 'Unknown Building';
      const floorName = bed.room?.floor?.name || 'Unknown Floor';
      const floorNumber = bed.room?.floor?.number ?? 0;
      const roomName = bed.room?.name || 'Unknown Room';
      const roomNumber = bed.room?.number || '';

      if (!buildings[buildingName]) buildings[buildingName] = {};
      const floorKey = `${floorName}|${floorNumber}`;
      if (!buildings[buildingName][floorKey]) buildings[buildingName][floorKey] = { name: floorName, number: floorNumber, rooms: {} };
      const roomKey = `${roomName}|${roomNumber}`;
      if (!buildings[buildingName][floorKey].rooms[roomKey]) {
        buildings[buildingName][floorKey].rooms[roomKey] = { name: roomName, number: roomNumber, beds: [] };
      }
      buildings[buildingName][floorKey].rooms[roomKey].beds.push(bed);
    });
    return buildings;
  }, [items]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      roomId: form.roomId,
      label: form.label.trim(),
      rentAmount: parseFloat(form.rentAmount) || 0,
    };
    if (!payload.roomId) { setErrors({ roomId: 'Please select a room' }); return; }
    if (!payload.label) { setErrors({ label: 'Bed label is required' }); return; }
    createMutation.mutate(payload);
  };

  const handleBedClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Beds" description="Manage beds within rooms" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Bed</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Bed</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Room</Label>
                  <Select value={form.roomId} onValueChange={(value) => setForm({ ...form, roomId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>{rooms?.map((r) => (<SelectItem key={r.id} value={r.id}>{r.floor?.building?.name || ''} - {r.floor?.name} - {r.name} ({r.number})</SelectItem>))}</SelectContent>
                  </Select>
                  {errors.roomId && <p className="text-sm text-red-500">{errors.roomId}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Bed Label</Label>
                  <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="A1" />
                  <p className="text-xs text-slate-400">Bed identifier (auto-uppercase)</p>
                  {errors.label && <p className="text-sm text-red-500">{errors.label}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Rent Amount (₹)</Label>
                  <Input type="number" min="0" step="100" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} />
                  {errors.rentAmount && <p className="text-sm text-red-500">{errors.rentAmount}</p>}
                </div>
              </div>
              {createMutation.error && Object.keys(errors).length === 0 && (
                <p className="text-sm text-red-500">{createMutation.error.response?.data?.message || 'Failed to create bed'}</p>
              )}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>Create Bed</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search beds..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></div><span className="text-xs text-slate-600 dark:text-slate-400">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-blue-200 dark:bg-blue-900/40 border border-blue-400"></div><span className="text-xs text-slate-600 dark:text-slate-400">Boy Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-pink-200 dark:bg-pink-900/40 border border-pink-400"></div><span className="text-xs text-slate-600 dark:text-slate-400">Girl Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300"></div><span className="text-xs text-slate-600 dark:text-slate-400">Maintenance</span></div>
      </div>

      {/* Visual Bed Map */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No beds yet. Create a room first.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBeds).map(([buildingName, floors]) => (
            <div key={buildingName} className="glass-card p-5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">{buildingName}</h2>
              <div className="space-y-4">
                {Object.entries(floors).map(([floorKey, floor]) => (
                  <div key={floorKey}>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{floor.name} (Floor {floor.number})</h3>
                    <div className="space-y-3">
                      {Object.entries(floor.rooms).map(([roomKey, room]) => (
                        <div key={roomKey} className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{room.name} ({room.number})</p>
                          <div className="flex flex-wrap gap-2">
                            {room.beds.map((bed) => (
                              <div
                                key={bed.id}
                                onClick={() => handleBedClick(bed.id)}
                                className={`relative w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${getBedColor(bed)}`}
                                title={bed.residents?.[0] ? `${bed.residents[0].firstName} ${bed.residents[0].lastName}` : 'Available'}
                              >
                                <span className={`text-xs font-bold ${getBedTextColor(bed)}`}>{bed.label}</span>
                                {bed.residents?.[0] ? (
                                  <span className={`text-[9px] font-medium mt-0.5 text-center leading-tight px-1 ${getBedTextColor(bed)}`}>
                                    {bed.residents[0].firstName?.split(' ')[0]}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Empty</span>
                                )}
                                {bed.status === 'OCCUPIED' && bed.residents?.[0]?.gender && (
                                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${bed.residents[0].gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                )}
                                {/* Delete button on hover */}
                                <button
                                  className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[8px] font-bold"
                                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(bed.id); }}
                                  title="Delete bed"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bed Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Location</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Building" value={detailData.room?.floor?.building?.name} />
                  <DetailField label="Floor" value={detailData.room?.floor?.name} />
                  <DetailField label="Room" value={detailData.room?.name} />
                  <DetailField label="Bed Label" value={detailData.label} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Rent Amount" value={formatCurrency(detailData.rentAmount)} />
                  <DetailField label="Status" value={detailData.status} />
                </div>
              </div>
              {detailData.residents && detailData.residents.length > 0 && (
                <div>
                  <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Current Resident</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <DetailField label="Name" value={`${detailData.residents[0].firstName} ${detailData.residents[0].lastName}`} />
                    <DetailField label="Phone" value={detailData.residents[0].phone} />
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
