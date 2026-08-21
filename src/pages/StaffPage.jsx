import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function StaffPage() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createLogin, setCreateLogin] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', designation: '', department: 'OPERATIONS', roleId: '', salary: '0', joiningDate: new Date().toISOString().split('T')[0], password: '', loginEmail: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/tenant/staff', { params: { limit: 50 } })).data,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/tenant/roles')).data.data,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['staff-detail', selectedId],
    queryFn: async () => (await api.get(`/tenant/staff/${selectedId}`)).data.data,
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/tenant/staff', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setOpen(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', designation: '', department: 'OPERATIONS', roleId: '', salary: '0', joiningDate: new Date().toISOString().split('T')[0], password: '', loginEmail: '' });
      setCreateLogin(false);
    },
  });

  const items = data?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      designation: form.designation.trim() || undefined,
      department: form.department,
      salary: parseFloat(form.salary) || 0,
      joiningDate: new Date(form.joiningDate).toISOString(),
      roleId: form.roleId || undefined,
      createUserAccount: createLogin,
      loginEmail: createLogin ? form.loginEmail.trim() : undefined,
      password: createLogin ? form.password : undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader title="Staff" description="Manage your team and operations" actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Staff</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-xl">
            <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9876543210" /></div>
                <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Warden, Cook, Guard..." /></div>
                <div><Label>Department</Label>
                  <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                    {['OPERATIONS', 'HOUSEKEEPING', 'SECURITY', 'KITCHEN', 'MAINTENANCE', 'ADMIN'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div><Label>Role</Label>
                  <select className="flex h-10 w-full rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-white/70 dark:bg-slate-800/50 px-3 text-sm" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                    <option value="">Select role...</option>
                    {(roles || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></div>
                <div><Label>Monthly Salary (₹)</Label><Input type="number" min="0" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
              </div>

              {/* Login Credentials Section */}
              <div className="border-t pt-4 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} className="rounded border-blue-300" />
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Create login credentials</span>
                  </div>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-7">Staff can login to Tenant Portal & App with their assigned role permissions</p>

                {createLogin && (
                  <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl space-y-3">
                    <div><Label>Login Email *</Label><Input type="email" value={form.loginEmail} onChange={(e) => setForm({ ...form, loginEmail: e.target.value })} placeholder="staff@example.com" /></div>
                    <div><Label>Login Password *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></div>
                    {!form.roleId && <p className="text-xs text-amber-600">⚠️ Select a role above — it controls what this staff can access</p>}
                    {form.roleId && <p className="text-xs text-blue-600">✅ Role: <strong>{roles?.find(r => r.id === form.roleId)?.name}</strong> — they'll only see pages allowed by this role</p>}
                  </div>
                )}
              </div>

              {createMutation.error && <p className="text-sm text-red-500">{createMutation.error.response?.data?.message || 'Failed to add staff'}</p>}
              <DialogFooter><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Adding...' : 'Add Staff'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No staff members</TableCell></TableRow>
              : items.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20" onClick={() => { setSelectedId(s.id); setDetailOpen(true); }}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{s.firstName} {s.lastName}</TableCell>
                  <TableCell>{s.designation || '-'}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{s.department}</span></TableCell>
                  <TableCell>{s.role?.name || '-'}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Staff Details</DialogTitle></DialogHeader>
          {detailLoading ? <p className="py-8 text-center text-slate-400">Loading...</p>
            : detailData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-slate-500">Name</span><p className="text-sm font-medium">{detailData.firstName} {detailData.lastName}</p></div>
                  <div><span className="text-xs text-slate-500">Email</span><p className="text-sm font-medium">{detailData.email}</p></div>
                  <div><span className="text-xs text-slate-500">Phone</span><p className="text-sm font-medium">{detailData.phone}</p></div>
                  <div><span className="text-xs text-slate-500">Role</span><p className="text-sm font-medium">{detailData.role?.name || '-'}</p></div>
                  <div><span className="text-xs text-slate-500">Department</span><p className="text-sm font-medium">{detailData.department}</p></div>
                  <div><span className="text-xs text-slate-500">Designation</span><p className="text-sm font-medium">{detailData.designation || '-'}</p></div>
                  <div><span className="text-xs text-slate-500">Joining Date</span><p className="text-sm font-medium">{formatDate(detailData.joiningDate)}</p></div>
                  <div><span className="text-xs text-slate-500">Salary</span><p className="text-sm font-medium">{formatCurrency(detailData.salary)}</p></div>
                  <div><span className="text-xs text-slate-500">Has Login</span><p className="text-sm font-medium">{detailData.tenantUserId ? '✅ Yes' : '❌ No'}</p></div>
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
