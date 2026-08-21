import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, PublicRoute } from '@/components/shared/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ResidentsPage from '@/pages/ResidentsPage';
import BuildingsPage from '@/pages/BuildingsPage';
import FloorsPage from '@/pages/FloorsPage';
import RoomsPage from '@/pages/RoomsPage';
import BedsPage from '@/pages/BedsPage';
import RentPage from '@/pages/RentPage';
import ComplaintsPage from '@/pages/ComplaintsPage';
import StaffPage from '@/pages/StaffPage';
import FinancePage from '@/pages/FinancePage';
import VisitorsPage from '@/pages/VisitorsPage';
import InventoryPage from '@/pages/InventoryPage';
import MaintenancePage from '@/pages/MaintenancePage';
import DocumentsPage from '@/pages/DocumentsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import PaymentSettingsPage from '@/pages/PaymentSettingsPage';
import DiscountsPage from '@/pages/DiscountsPage';
import PromotionsPage from '@/pages/PromotionsPage';
import FoodMenuPage from '@/pages/FoodMenuPage';
import RolesPage from '@/pages/RolesPage';
import BedMapPage from '@/pages/BedMapPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="residents" element={<ResidentsPage />} />
              <Route path="buildings" element={<BuildingsPage />} />
              <Route path="floors" element={<FloorsPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="beds" element={<BedsPage />} />
              <Route path="rent" element={<RentPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="visitors" element={<VisitorsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="payment-settings" element={<PaymentSettingsPage />} />
              <Route path="discounts" element={<DiscountsPage />} />
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="food-menu" element={<FoodMenuPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="bed-map" element={<BedMapPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
