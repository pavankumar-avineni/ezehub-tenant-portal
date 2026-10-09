import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
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

export default function ComplaintsPage() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ buildingId: '', residentId: '', title: '', description: '', category: 'MAINTENANCE', priority: 'MEDIUM' });
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => (await api.get('/tenant/complaints', { params: { limit: 50 } })).data,
  });

  const { data: buildings } = useQuery({
    queryKey: ['buildings-list'],
    queryFn: async () => (await api.get('/tenant/buildings', { params: { limit: 100 } })).data.data,
  });

  const { data: residents } = useQuery({
    queryKey: ['residents-list'],
    queryFn: async () => (await api.get('/tenant/residents', { params: { limit: 200, status: 'ACTIVE' } })).data.data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['complaint-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/complaints/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/complaints', payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['complaints'] }); 
      setOpen(false); 
      setForm({ buildingId: '', residentId: '', title: '', description: '', category: 'MAINTENANCE', priority: 'MEDIUM' });
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

  const items = data?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.buildingId) { setErrors({ buildingId: 'Please select a building' }); return; }
    if (!form.residentId) { setErrors({ residentId: 'Please select a resident' }); return; }
    if (form.title.trim().length < 3) { setErrors({ title: 'Title must be at least 3 characters' }); return; }
    if (form.description.trim().length < 10) { setErrors({ description: 'Description must be at least 10 characters' }); return; }
    createMutation.mutate({
      buildingId: form.buildingId,
      residentId: form.residentId,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
    });
  };

  const handleRowClick = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div>
      <PageHeader title="Complaints" description="Track and resolve resident issues" />
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No complaints</TableCell></TableRow>
              : items.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20" onClick={() => handleRowClick(c.id)}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{c.title}</TableCell>
                  <TableCell>{c.category}</TableCell>
                  <TableCell><StatusBadge status={c.priority} /></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Complaint Details</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="py-8 text-center text-slate-400">Loading details...</div>
          ) : detailData ? (
            <div className="space-y-5">
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Complaint Info</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Title" value={detailData.title} />
                  <DetailField label="Category" value={detailData.category} />
                  <DetailField label="Priority" value={detailData.priority} />
                  <DetailField label="Status" value={detailData.status} />
                  <DetailField label="Created" value={formatDate(detailData.createdAt)} />
                  <DetailField label="Building" value={detailData.building?.name} />
                </div>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{detailData.description || '-'}</p>
              </div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold text-xs uppercase tracking-wider mb-3">People</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailField label="Resident" value={detailData.resident ? `${detailData.resident.firstName} ${detailData.resident.lastName}` : null} />
                  <DetailField label="Assigned Staff" value={detailData.assignedStaff ? `${detailData.assignedStaff.firstName} ${detailData.assignedStaff.lastName}` : null} />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
