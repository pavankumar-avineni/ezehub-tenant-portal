import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, Building2, Layers, DoorOpen, Bed, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

export default function PropertyPage() {
  const [level, setLevel] = useState('buildings'); // buildings | floors | rooms
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [dialog, setDialog] = useState(null); // { type: 'add-building' | 'edit-building' | 'add-floor' | ... , data?: {} }
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'building'|'floor'|'room'|'bed', id, name }
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  // ─── DATA QUERIES ───────────────────────────────────
  const { data: buildingTypes } = useQuery({
    queryKey: ['building-types'],
    queryFn: async () => (await api.get('/tenant/building-types')).data.data,
  });

  const { data: buildings, isLoading: bLoading } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: floors, isLoading: fLoading } = useQuery({
    queryKey: ['property-floors', selectedBuilding?.id],
    queryFn: async () => {
      const res = await api.get('/tenant/floors', { params: { buildingId: selectedBuilding.id, limit: 100 } });
      return res.data.data || [];
    },
    enabled: !!selectedBuilding && level === 'floors',
    staleTime: 0,
    gcTime: 0,
  });

  const { data: bedMap, isLoading: rLoading } = useQuery({
    queryKey: ['property-bedmap', selectedBuilding?.id, selectedFloor?.id],
    queryFn: async () => (await api.get(`/tenant/bed-map/${selectedBuilding.id}`)).data.data,
    enabled: !!selectedBuilding && !!selectedFloor && level === 'rooms',
  });

  // ─── MUTATIONS ──────────────────────────────────────
  const createBuilding = useMutation({ mutationFn: (d) => api.post('/tenant/buildings', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buildings'] }); closeDialog(); } });
  const updateBuilding = useMutation({ mutationFn: ({ id, ...d }) => api.put(`/tenant/buildings/${id}`, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buildings'] }); closeDialog(); } });
  const deleteBuilding = useMutation({ mutationFn: (id) => api.delete(`/tenant/buildings/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['buildings'] }); } });

  const createFloor = useMutation({ mutationFn: (d) => api.post('/tenant/floors', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-floors'] }); closeDialog(); } });
  const updateFloor = useMutation({ mutationFn: ({ id, ...d }) => api.put(`/tenant/floors/${id}`, d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-floors'] }); closeDialog(); } });
  const deleteFloor = useMutation({ mutationFn: (id) => api.delete(`/tenant/floors/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-floors'] }); } });

  const createRoom = useMutation({ mutationFn: (d) => api.post('/tenant/rooms', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-bedmap'] }); closeDialog(); } });
  const deleteRoom = useMutation({ mutationFn: (id) => api.delete(`/tenant/rooms/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-bedmap'] }); } });

  const createBed = useMutation({ mutationFn: (d) => api.post('/tenant/beds', d), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-bedmap'] }); closeDialog(); } });
  const deleteBed = useMutation({ mutationFn: (id) => api.delete(`/tenant/beds/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property-bedmap'] }); } });

  // ─── HELPERS ────────────────────────────────────────
  const closeDialog = () => { setDialog(null); setForm({}); };

  const navigateTo = (newLevel, building, floor) => {
    setLevel(newLevel);
    if (building !== undefined) setSelectedBuilding(building);
    if (floor !== undefined) setSelectedFloor(floor);
  };

  const getBedColor = (bed) => {
    if (bed.status === 'AVAILABLE') return 'bg-slate-100 dark:bg-slate-700 border-slate-300';
    if (bed.status === 'MAINTENANCE') return 'bg-yellow-50 border-yellow-300';
    if (bed.gender === 'MALE') return 'bg-blue-100 border-blue-400';
    if (bed.gender === 'FEMALE') return 'bg-pink-100 border-pink-400';
    return 'bg-purple-100 border-purple-400';
  };

  const getBedText = (bed) => {
    if (bed.status === 'AVAILABLE') return 'text-slate-500';
    if (bed.gender === 'MALE') return 'text-blue-700';
    if (bed.gender === 'FEMALE') return 'text-pink-700';
    return 'text-purple-700';
  };

  // Get rooms for selected floor from bed map data
  const floorData = bedMap?.find(f => f.id === selectedFloor?.id);

  return (
    <div>
      {/* ─── BREADCRUMB ─── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button onClick={() => navigateTo('buildings', null, null)} className={`text-sm font-medium ${level === 'buildings' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
          Property
        </button>
        {selectedBuilding && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <button onClick={() => navigateTo('floors', selectedBuilding, null)} className={`text-sm font-medium ${level === 'floors' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
              {selectedBuilding.name}
            </button>
          </>
        )}
        {selectedFloor && level === 'rooms' && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-blue-600">{selectedFloor.name}</span>
          </>
        )}
      </div>

      {/* ═══ BUILDINGS LEVEL ═══ */}
      {level === 'buildings' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Your Properties</h1>
              <p className="text-sm text-slate-500">Tap a building to explore its floors and rooms</p>
            </div>
            <Button onClick={() => { setDialog({ type: 'add-building' }); setForm({ buildingTypeId: '', name: '', code: '', address: '', city: '' }); }}>
              <Plus className="h-4 w-4" /> Add Building
            </Button>
          </div>

          {bLoading ? <p className="text-center py-12 text-slate-400">Loading...</p> :
            !buildings?.length ? <p className="text-center py-12 text-slate-400">No buildings yet. Add your first property.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {buildings.map(b => (
                  <div key={b.id} className="glass-card p-5 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-blue-300 transition-all relative group" onClick={() => navigateTo('floors', b, null)}>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setDialog({ type: 'edit-building' }); setForm({ id: b.id, buildingTypeId: b.buildingTypeId, name: b.name, code: b.code, address: b.address, city: b.city }); }}><Pencil className="h-3.5 w-3.5 text-slate-500" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'building', id: b.id, name: b.name }); }}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-500 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{b.city || b.address || b.code}</p>
                    <div className="flex gap-4 mt-4 pt-3 border-t text-xs text-slate-500">
                      <span>{b._count?.floors ?? 0} floors</span>
                      <span>{b._count?.rooms ?? 0} rooms</span>
                      <span>{b._count?.beds ?? 0} beds</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ═══ FLOORS LEVEL ═══ */}
      {level === 'floors' && selectedBuilding && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('buildings', null, null)} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-slate-500" /></button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedBuilding.name}</h1>
                <p className="text-sm text-slate-500">Tap a floor to see rooms & bed map</p>
              </div>
            </div>
            <Button onClick={() => { setDialog({ type: 'add-floor' }); setForm({ name: '', number: '' }); }}>
              <Plus className="h-4 w-4" /> Add Floor
            </Button>
          </div>

          {fLoading ? <p className="text-center py-12 text-slate-400">Loading...</p> :
            !floors?.length ? <p className="text-center py-12 text-slate-400">No floors. Add the first floor for this building.</p> : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {floors.map(f => (
                  <div key={f.id} className="glass-card p-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-blue-300 transition-all relative group" onClick={() => navigateTo('rooms', selectedBuilding, f)}>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); setDialog({ type: 'edit-floor' }); setForm({ id: f.id, name: f.name, number: f.number }); }}><Pencil className="h-3 w-3 text-slate-500" /></button>
                      <button className="p-1 rounded hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'floor', id: f.id, name: f.name }); }}><Trash2 className="h-3 w-3 text-red-500" /></button>
                    </div>
                    <Layers className="h-6 w-6 text-emerald-500 mb-2" />
                    <h3 className="text-base font-semibold text-slate-800 dark:text-white">{f.name}</h3>
                    <p className="text-xs text-slate-500">Floor {f.number} • {f._count?.rooms ?? 0} rooms</p>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ═══ ROOMS + BED MAP LEVEL ═══ */}
      {level === 'rooms' && selectedBuilding && selectedFloor && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateTo('floors', selectedBuilding, null)} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-slate-500" /></button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedFloor.name}</h1>
                <p className="text-sm text-slate-500">{selectedBuilding.name} • Rooms & Bed Map</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setDialog({ type: 'add-room' }); setForm({ name: '', number: '', capacity: '2', rentAmount: '0' }); }}>
                <DoorOpen className="h-4 w-4" /> Add Room
              </Button>
              <Button onClick={() => { setDialog({ type: 'add-bed' }); setForm({ roomId: '', label: '', rentAmount: '0' }); }}>
                <Bed className="h-4 w-4" /> Add Bed
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 flex-wrap text-xs">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></span> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-blue-200 border border-blue-400"></span> Boy</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-pink-200 border border-pink-400"></span> Girl</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></span> Maintenance</span>
          </div>

          {rLoading ? <p className="text-center py-12 text-slate-400">Loading bed map...</p> :
            !floorData?.rooms?.length ? <p className="text-center py-12 text-slate-400">No rooms on this floor. Add one above.</p> : (
              <div className="space-y-4">
                {floorData.rooms.map(room => (
                  <div key={room.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-emerald-500" />
                        <h4 className="font-semibold text-slate-800 dark:text-white">{room.name}</h4>
                        <span className="text-xs text-slate-400">({room.number})</span>
                      </div>
                      <button className="p-1 rounded hover:bg-red-50" onClick={() => { setConfirmDelete({ type: 'room', id: room.id, name: room.name }); }}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {room.beds.map(bed => (
                        <div key={bed.id} className={`relative w-[72px] h-[72px] rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 ${getBedColor(bed)}`}
                          title={bed.resident ? `${bed.resident.name} (${bed.resident.phone})` : 'Available'}
                          onClick={() => { if (bed.resident) alert(`${bed.resident.name}\nPhone: ${bed.resident.phone}\nGender: ${bed.resident.gender || 'N/A'}`); }}
                        >
                          <span className={`text-[11px] font-bold ${getBedText(bed)}`}>{bed.label}</span>
                          {bed.resident ? (
                            <span className={`text-[8px] mt-0.5 ${getBedText(bed)}`}>{bed.resident.name.split(' ')[0]}</span>
                          ) : (
                            <span className="text-[8px] text-slate-400">Empty</span>
                          )}
                          {bed.status !== 'OCCUPIED' && (
                            <button className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'bed', id: bed.id, name: bed.label }); }}>×</button>
                          )}
                          {bed.gender && <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${bed.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>}
                        </div>
                      ))}
                      {room.beds.length === 0 && <p className="text-xs text-slate-400 italic">No beds — add one</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ═══ DIALOGS ═══ */}
      <Dialog open={!!dialog} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>
            {dialog?.type === 'add-building' && 'Add Building'}
            {dialog?.type === 'edit-building' && 'Edit Building'}
            {dialog?.type === 'add-floor' && 'Add Floor'}
            {dialog?.type === 'edit-floor' && 'Edit Floor'}
            {dialog?.type === 'add-room' && 'Add Room'}
            {dialog?.type === 'add-bed' && 'Add Bed'}
          </DialogTitle></DialogHeader>

          {/* Building Form */}
          {(dialog?.type === 'add-building' || dialog?.type === 'edit-building') && (
            <div className="space-y-3">
              <div><Label>Building Type</Label>
                <Select value={form.buildingTypeId} onValueChange={v => setForm({...form, buildingTypeId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{buildingTypes?.map(bt => <SelectItem key={bt.id} value={bt.id}>{bt.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Building A" /></div>
                <div><Label>Code</Label><Input value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} placeholder="B1" /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="123 Main St" /></div>
              <div><Label>City</Label><Input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} placeholder="Bengaluru" /></div>
            </div>
          )}

          {/* Floor Form */}
          {(dialog?.type === 'add-floor' || dialog?.type === 'edit-floor') && (
            <div className="space-y-3">
              <div><Label>Floor Name</Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ground Floor" /></div>
              <div><Label>Floor Number</Label><Input type="number" min="0" value={form.number ?? ''} onChange={e => setForm({...form, number: e.target.value})} placeholder="0" /></div>
            </div>
          )}

          {/* Room Form */}
          {dialog?.type === 'add-room' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Room Name</Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Room 101" /></div>
                <div><Label>Room Number</Label><Input value={form.number || ''} onChange={e => setForm({...form, number: e.target.value})} placeholder="101" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Capacity</Label><Input type="number" min="1" value={form.capacity || ''} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
                <div><Label>Rent (₹)</Label><Input type="number" min="0" value={form.rentAmount || ''} onChange={e => setForm({...form, rentAmount: e.target.value})} /></div>
              </div>
            </div>
          )}

          {/* Bed Form */}
          {dialog?.type === 'add-bed' && (
            <div className="space-y-3">
              <div><Label>Room</Label>
                <Select value={form.roomId} onValueChange={v => setForm({...form, roomId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>{floorData?.rooms?.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.number})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bed Label</Label><Input value={form.label || ''} onChange={e => setForm({...form, label: e.target.value})} placeholder="A1" /></div>
                <div><Label>Rent (₹)</Label><Input type="number" min="0" value={form.rentAmount || ''} onChange={e => setForm({...form, rentAmount: e.target.value})} /></div>
              </div>
            </div>
          )}

          <DialogFooter>
            {dialog?.type === 'add-building' && <Button onClick={() => createBuilding.mutate(form)} disabled={createBuilding.isPending}>{createBuilding.isPending ? 'Creating...' : 'Create Building'}</Button>}
            {dialog?.type === 'edit-building' && <Button onClick={() => updateBuilding.mutate(form)} disabled={updateBuilding.isPending}>{updateBuilding.isPending ? 'Saving...' : 'Save Changes'}</Button>}
            {dialog?.type === 'add-floor' && <Button onClick={() => createFloor.mutate({ ...form, buildingId: selectedBuilding.id, number: parseInt(form.number) })} disabled={createFloor.isPending}>{createFloor.isPending ? 'Creating...' : 'Create Floor'}</Button>}
            {dialog?.type === 'edit-floor' && <Button onClick={() => updateFloor.mutate(form)} disabled={updateFloor.isPending}>{updateFloor.isPending ? 'Saving...' : 'Save Changes'}</Button>}
            {dialog?.type === 'add-room' && <Button onClick={() => createRoom.mutate({ ...form, floorId: selectedFloor.id, capacity: parseInt(form.capacity), rentAmount: parseFloat(form.rentAmount) || 0 })} disabled={createRoom.isPending}>{createRoom.isPending ? 'Creating...' : 'Create Room'}</Button>}
            {dialog?.type === 'add-bed' && <Button onClick={() => createBed.mutate({ ...form, rentAmount: parseFloat(form.rentAmount) || 0 })} disabled={createBed.isPending}>{createBed.isPending ? 'Creating...' : 'Create Bed'}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <div className="text-center pt-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Delete {confirmDelete?.type}?</h3>
            <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
            <p className="text-base font-bold text-slate-800 dark:text-white mb-4">"{confirmDelete?.name}"</p>
            <p className="text-xs text-red-500">This action cannot be undone.</p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => {
              if (confirmDelete?.type === 'building') deleteBuilding.mutate(confirmDelete.id);
              else if (confirmDelete?.type === 'floor') deleteFloor.mutate(confirmDelete.id);
              else if (confirmDelete?.type === 'room') deleteRoom.mutate(confirmDelete.id);
              else if (confirmDelete?.type === 'bed') deleteBed.mutate(confirmDelete.id);
              setConfirmDelete(null);
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
