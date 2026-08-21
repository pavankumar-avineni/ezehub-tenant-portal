import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, Image } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const CATEGORIES = ['FOOD', 'LAUNDRY', 'GYM', 'HOTEL', 'TRANSPORT', 'PG', 'CLOUD_KITCHEN', 'OTHER'];

export default function PromotionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ businessName: '', category: 'FOOD', description: '', contactPhone: '', offerText: '', address: '', startDate: '', endDate: '' });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => (await api.get('/tenant/promotions', { params: { limit: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/promotions', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['promotions'] }); setShowCreate(false); setForm({ businessName: '', category: 'FOOD', description: '', contactPhone: '', offerText: '', address: '', startDate: '', endDate: '' }); setPhotos([]); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenant/promotions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - photos.length);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const { data } = await api.post('/tenant/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPhotos((prev) => [...prev, data.data?.url || data.data?.fileUrl]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    setUploading(false);
  };

  const items = data?.data || [];

  return (
    <div>
      <PageHeader title="Promotions & Tie-ups" description="Partner with businesses to offer deals to your residents" actions={
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Promotion</Button>
      } />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-slate-400 col-span-3 text-center py-8">Loading...</p>}
        {items.map((p) => (
          <div key={p.id} className="glass-card p-5 relative group">
            {/* Photos */}
            {p.photos?.length > 0 && (
              <div className="flex gap-2 mb-3">
                {p.photos.slice(0, 3).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover border" />
                ))}
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">{p.businessName}</h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded mt-1 inline-block">{p.category}</span>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p.id); }}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
            {p.offerText && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">🎁 {p.offerText}</p>}
            {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{p.description}</p>}
            {p.contactPhone && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">📞 {p.contactPhone}</p>}
            {p.address && <p className="text-xs text-slate-500 mt-1">📍 {p.address}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{formatDate(p.startDate)} — {p.endDate ? formatDate(p.endDate) : 'Ongoing'}</span>
              <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>
          </div>
        ))}
        {!isLoading && items.length === 0 && <p className="text-slate-400 col-span-3 text-center py-8">No promotions yet</p>}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Promotion</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Business Name *</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Cloud Kitchen Express" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><select className="w-full rounded-xl border px-3 py-2 text-sm bg-white dark:bg-slate-800" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="9876543210" /></div>
            </div>
            <div><Label>Offer Text</Label><Input value={form.offerText} onChange={(e) => setForm({ ...form, offerText: e.target.value })} placeholder="20% off for EzeHub residents" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Healthy meals delivered daily" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" /></div>

            {/* Image Upload */}
            <div>
              <Label>Photos (max 3)</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border" />
                    <button className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <button className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500" onClick={() => fileRef.current?.click()}>
                    {uploading ? '...' : <><Upload className="h-5 w-5" /><span className="text-[9px] mt-1">Upload</span></>}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMutation.mutate({ ...form, photos })} disabled={!form.businessName || !form.startDate || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Add Promotion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
