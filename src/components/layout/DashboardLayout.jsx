import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, IndianRupee, MessageSquare, UserCog,
  Wallet, LogOut, Moon, Sun, ChevronLeft, ChevronRight, UserCheck, Package,
  Wrench, FileText, Bell, DoorOpen, Bed, CreditCard, Settings, Percent, Megaphone, UtensilsCrossed, Shield, Map,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/residents', icon: Users, label: 'Residents' },
  { to: '/buildings', icon: Building2, label: 'Buildings' },
  { to: '/floors', icon: ChevronLeft, label: 'Floors' },
  { to: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/beds', icon: Bed, label: 'Beds' },
  { to: '/rent', icon: IndianRupee, label: 'Rent & Payments' },
  { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/staff', icon: UserCog, label: 'Staff' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/visitors', icon: UserCheck, label: 'Visitors' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/payment-settings', icon: Settings, label: 'Payment Settings' },
  { to: '/discounts', icon: Percent, label: 'Discounts' },
  { to: '/promotions', icon: Megaphone, label: 'Promotions' },
  { to: '/food-menu', icon: UtensilsCrossed, label: 'Food Menu' },
  { to: '/roles', icon: Shield, label: 'Roles' },
  { to: '/bed-map', icon: Map, label: 'Bed Map' },
];

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden premium-bg">
      {/* Sidebar */}
      <aside className={cn('flex flex-col glass-sidebar transition-all duration-300 z-20', collapsed ? 'w-[72px]' : 'w-64')}>
        <div className="flex h-16 items-center gap-3 border-b border-blue-100/50 dark:border-blue-900/30 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white shadow-lg shadow-blue-500/25">
            E
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold block bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-blue-500">EzeHub</span>
              <span className="text-[10px] text-blue-600/60 dark:text-blue-400/60 font-medium truncate max-w-[140px] block">{user?.tenant?.name}</span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-blue-100/50 dark:border-blue-900/30 p-3 space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-500 dark:text-slate-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span className="ml-2">{dark ? 'Light' : 'Dark'}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-500 dark:text-slate-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between liquid-glass mx-4 mt-4 px-6 rounded-2xl premium-shadow">
          <p className="text-sm font-semibold text-blue-900/70 dark:text-blue-200/70">{user?.tenant?.name || 'Tenant Portal'}</p>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-blue-600/60 dark:text-blue-400/60 font-medium">{user?.role?.name}</p>
            </div>
            <Avatar className="ring-2 ring-blue-400/30 ring-offset-2 ring-offset-transparent shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-sm">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}
