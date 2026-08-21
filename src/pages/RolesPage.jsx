import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Check, X, Key } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RolesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [newRolePerms, setNewRolePerms] = useState([]);
  const [expandedRole, setExpandedRole] = useState(null);
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/tenant/roles')).data.data,
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/tenant/permissions')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/tenant/roles', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setShowCreate(false); setForm({ name: '', description: '' }); setNewRolePerms([]); },
  });

  const updatePermsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }) => api.put(`/tenant/roles/${roleId}/permissions`, { permissionIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  // Group permissions by module
  const permsByModule = (permissions || []).reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const togglePermission = (role, permId) => {
    const currentPerms = role.permissions?.map((rp) => rp.permission?.id || rp.permissionId) || [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((id) => id !== permId)
      : [...currentPerms, permId];
    updatePermsMutation.mutate({ roleId: role.id, permissionIds: newPerms });
  };

  const hasPermission = (role, permId) => {
    return role.permissions?.some((rp) => (rp.permission?.id || rp.permissionId) === permId);
  };

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Create roles, assign permissions — staff sees only what their role allows" actions={
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Create Role</Button>
      } />

      {/* ═══ ROLES SECTION ═══ */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Roles</h2>
        </div>

        <div className="space-y-3">
          {(roles || []).map((role) => (
            <div key={role.id} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10" onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{role.name}</h3>
                    <p className="text-xs text-slate-500">{role.slug} • {role.permissions?.length || 0} permissions • {(role._count?.tenantUsers || 0) + (role._count?.staffMembers || 0)} users</p>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-medium">{expandedRole === role.id ? 'Hide ▲' : 'Show Permissions ▼'}</span>
              </div>

              {expandedRole === role.id && (
                <div className="border-t border-blue-100/50 dark:border-blue-900/30 p-4 bg-slate-50/50 dark:bg-slate-900/30">
                  {role.isSystem && <p className="text-xs text-amber-600 mb-3">⚠️ System role — all permissions granted</p>}
                  <div className="space-y-4">
                    {Object.entries(permsByModule).map(([module, perms]) => (
                      <div key={module}>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">{module}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                          {perms.map((p) => {
                            const active = hasPermission(role, p.id);
                            return (
                              <button
                                key={p.id}
                                onClick={() => !role.isSystem && togglePermission(role, p.id)}
                                disabled={role.isSystem || updatePermsMutation.isPending}
                                className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                                  active
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-200'
                                } ${role.isSystem ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                              >
                                {active ? <Check className="h-3 w-3 text-blue-600" /> : <X className="h-3 w-3 text-slate-400" />}
                                <span className="truncate">{p.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ ALL PERMISSIONS SECTION ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">All Permissions</h2>
          <span className="text-xs text-slate-400 ml-2">({permissions?.length || 0} total)</span>
        </div>

        <div className="glass-card p-5">
          <div className="space-y-5">
            {Object.entries(permsByModule).map(([module, perms]) => (
              <div key={module}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{module}</span>
                  <span className="text-[10px] text-slate-400">({perms.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {perms.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                      <Key className="h-3 w-3 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.slug}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Warden, Accountant, Manager..." /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this role does" /></div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Assign Permissions ({newRolePerms.length} selected)</p>
              {Object.entries(permsByModule).map(([module, perms]) => (
                <div key={module} className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-blue-600 uppercase">{module}</p>
                    <button className="text-[10px] text-blue-500 hover:underline" onClick={() => {
                      const modulePermIds = perms.map(p => p.id);
                      const allSelected = modulePermIds.every(id => newRolePerms.includes(id));
                      if (allSelected) setNewRolePerms(prev => prev.filter(id => !modulePermIds.includes(id)));
                      else setNewRolePerms(prev => [...new Set([...prev, ...modulePermIds])]);
                    }}>
                      {perms.every(p => newRolePerms.includes(p.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                    {perms.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input type="checkbox" checked={newRolePerms.includes(p.id)} onChange={() => setNewRolePerms(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} className="rounded border-blue-300" />
                        <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <span className="text-xs text-slate-500 mr-auto">{newRolePerms.length} permissions selected</span>
            <Button onClick={() => createMutation.mutate({ ...form, permissionIds: newRolePerms })} disabled={!form.name.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
