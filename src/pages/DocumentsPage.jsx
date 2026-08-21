import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, FileText, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

export default function DocumentsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('RESIDENT');
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/tenant/documents', { params: { limit: 50 } })).data,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => api.post('/tenant/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documents'] }); setOpen(false); setName(''); if (fileRef.current) fileRef.current.value = ''; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tenant/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const documents = data?.data || [];

  const handleUpload = (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || file.name);
    formData.append('entityType', entityType);
    uploadMutation.mutate(formData);
  };

  return (
    <div>
      <PageHeader title="Documents" description="Upload and manage resident and property documents" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Upload className="h-4 w-4" /> Upload</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2"><Label>Document Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional — defaults to filename" /></div>
              <div className="space-y-2"><Label>Entity Type</Label>
                <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                  {['RESIDENT', 'BUILDING', 'STAFF', 'AGREEMENT', 'OTHER'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>File</Label><Input type="file" ref={fileRef} required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" /></div>
              {uploadMutation.error && <p className="text-sm text-red-500">{uploadMutation.error.response?.data?.message}</p>}
              <DialogFooter><Button type="submit" disabled={uploadMutation.isPending}>Upload</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Format</TableHead><TableHead>Uploaded</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : documents.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No documents uploaded</TableCell></TableRow>
              : documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" />{doc.name}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{doc.entityType}</span></TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {doc.url && <a href={doc.url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4 text-blue-500" /></Button></a>}
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(doc.id)}><Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
