import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

export default function BedMapPage() {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedBed, setSelectedBed] = useState(null);
  const [assignResident, setAssignResident] = useState('');
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: bedMap, isLoading } = useQuery({
    queryKey: ['bed-map', selectedBuilding],
    queryFn: async () => (await api.get(`/tenant/bed-map/${selectedBuilding}`)).data.data,
    enabled: !!selectedBuilding,
  });

  // Get residents without beds (for assignment) + all active residents (for transfer)
  const { data: residents } = useQuery({
    queryKey: ['residents-for-assign'],
    queryFn: async () => (await api.get('/tenant/residents', { params: { status: 'ACTIVE', limit: 200 } })).data.data,
    enabled: !!selectedBed && !selectedBed.resident,
  });

  // Transfer resident to this bed
  const transferMutation = useMutation({
    mutationFn: ({ residentId, toBedId }) => api.post(`/tenant/residents/${residentId}/transfer`, { toBedId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bed-map'] });
      setSelectedBed(null);
      setAssignResident('');
    },
  });

  const getBedColor = (bed) => {
    if (bed.status === 'AVAILABLE') return 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50';
    if (bed.status === 'MAINTENANCE') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300';
    if (bed.gender === 'MALE') return 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 hover:border-blue-600';
    if (bed.gender === 'FEMALE') return 'bg-pink-100 dark:bg-pink-900/40 border-pink-400 hover:border-pink-600';
    return 'bg-purple-100 dark:bg-purple-900/40 border-purple-400';
  };

  const getBedTextColor = (bed) => {
    if (bed.status === 'AVAILABLE') return 'text-slate-500';
    if (bed.gender === 'MALE') return 'text-blue-700 dark:text-blue-300';
    if (bed.gender === 'FEMALE') return 'text-pink-700 dark:text-pink-300';
    return 'text-purple-700';
  };

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setAssignResident('');
  };

  return (
    <div>
      <PageHeader title="Bed Map" description="Tap a bed to view resident or assign one — Blue: Boy, Pink: Girl, Grey: Available" />

      {/* Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-slate-200 border border-slate-300"></div><span className="text-xs text-slate-600">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-blue-200 border border-blue-400"></div><span className="text-xs text-slate-600">Boy Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-pink-200 border border-pink-400"></div><span className="text-xs text-slate-600">Girl Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-yellow-100 border border-yellow-300"></div><span className="text-xs text-slate-600">Maintenance</span></div>
      </div>

      <div className="mb-6">
        <Label className="mb-2 block">Select Building</Label>
        <select className="rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 py-2 text-sm w-full max-w-md" value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
          <option value="">Choose a building...</option>
          {(buildings || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-center text-slate-400 py-8">Loading bed map...</p>}

      {bedMap && bedMap.map((floor) => (
        <div key={floor.id} className="glass-card p-4 mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{floor.name} (Floor {floor.number})</h3>
          <div className="space-y-3">
            {floor.rooms.map((room) => (
              <div key={room.id} className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{room.name} ({room.number})</p>
                <div className="flex flex-wrap gap-2">
                  {room.beds.map((bed) => (
                    <div
                      key={bed.id}
                      onClick={() => handleBedClick(bed)}
                      className={`relative w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${getBedColor(bed)}`}
                    >
                      <span className={`text-xs font-bold ${getBedTextColor(bed)}`}>{bed.label}</span>
                      {bed.resident ? (
                        <span className={`text-[9px] font-medium mt-0.5 text-center leading-tight ${getBedTextColor(bed)}`}>{bed.resident.name.split(' ')[0]}</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 mt-0.5">Empty</span>
                      )}
                      {bed.status === 'OCCUPIED' && bed.gender && (
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${bed.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                      )}
                    </div>
                  ))}
                  {room.beds.length === 0 && <p className="text-xs text-slate-400 italic">No beds</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!selectedBuilding && <p className="text-center text-slate-400 py-12">Select a building to view the bed map</p>}

      {/* Bed Detail / Assign Dialog */}
      <Dialog open={!!selectedBed} onOpenChange={() => setSelectedBed(null)}>
        <DialogContent>
          {selectedBed && (
            <>
              <DialogHeader>
                <DialogTitle>Bed {selectedBed.label}</DialogTitle>
              </DialogHeader>

              {/* OCCUPIED — Show resident details */}
              {selectedBed.resident ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${selectedBed.gender === 'FEMALE' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                      {selectedBed.resident.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-slate-800 dark:text-white">{selectedBed.resident.name}</h4>
                      <p className="text-sm text-slate-500">{selectedBed.resident.phone}</p>
                      <p className="text-xs text-slate-400">{selectedBed.resident.gender || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Status: <strong className="text-green-600">Occupied</strong></p>
                    <p>Bed: <strong>{selectedBed.label}</strong></p>
                  </div>
                </div>
              ) : (
                /* EMPTY — Assign a resident */
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
                      <Plus className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">This bed is empty</p>
                    <p className="text-xs text-slate-400">Assign an existing resident to this bed (transfers them from their current bed)</p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Select Resident to Assign</Label>
                    <Select value={assignResident} onValueChange={setAssignResident}>
                      <SelectTrigger><SelectValue placeholder="Choose a resident..." /></SelectTrigger>
                      <SelectContent>
                        {(residents || []).map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.firstName} {r.lastName} — {r.phone} {r.bed ? `(Currently: ${r.bed?.room?.name} - ${r.bed?.label})` : '(No bed)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignResident && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ This will transfer the resident to bed <strong>{selectedBed.label}</strong>. Their previous bed will become available.
                    </p>
                  )}
                </div>
              )}

              <DialogFooter>
                {!selectedBed.resident && assignResident && (
                  <Button
                    onClick={() => transferMutation.mutate({ residentId: assignResident, toBedId: selectedBed.id })}
                    disabled={transferMutation.isPending}
                  >
                    <User className="h-4 w-4" />
                    {transferMutation.isPending ? 'Assigning...' : 'Assign to This Bed'}
                  </Button>
                )}
                {transferMutation.error && (
                  <p className="text-sm text-red-500 w-full">{transferMutation.error.response?.data?.message || 'Transfer failed'}</p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
