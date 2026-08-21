import { useQuery } from '@tanstack/react-query';
import { Building2, Users, MessageSquare, BedDouble, IndianRupee, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: async () => (await api.get('/tenant/dashboard')).data.data,
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Real-time overview of your property" />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl glass-card animate-pulse shimmer-glass" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Buildings" value={data?.totalBuildings ?? 0} icon={Building2} />
          <StatCard title="Active Residents" value={data?.activeResidents ?? 0} subtitle={`${data?.totalResidents ?? 0} total`} icon={Users} />
          <StatCard title="Occupancy Rate" value={`${data?.occupancyRate ?? 0}%`} icon={BedDouble} />
          <StatCard title="Staff" value={data?.totalStaff ?? 0} icon={UserCheck} />
          <StatCard title="Open Complaints" value={data?.openComplaints ?? 0} icon={MessageSquare} />
          <StatCard title="Pending Rent" value={formatCurrency(data?.pendingRent)} icon={IndianRupee} />
        </div>
      )}
    </div>
  );
}
