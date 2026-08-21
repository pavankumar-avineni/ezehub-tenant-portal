import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/tenant/notifications', { params: { limit: 50 } })).data,
  });

  const readMutation = useMutation({
    mutationFn: (id) => api.put(`/tenant/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put('/tenant/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Message</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-[80px]" /></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading...</TableCell></TableRow>
              : notifications.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No notifications</TableCell></TableRow>
              : notifications.map((n) => (
                <TableRow key={n.id} className={n.status !== 'READ' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}>
                  <TableCell className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    {n.status !== 'READ' && <Bell className="h-4 w-4 text-blue-500" />}
                    {n.title}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{n.message}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{n.channel}</span></TableCell>
                  <TableCell><StatusBadge status={n.status} /></TableCell>
                  <TableCell>{formatDate(n.createdAt)}</TableCell>
                  <TableCell>
                    {n.status !== 'READ' && (
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800" onClick={() => readMutation.mutate(n.id)}>Read</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
