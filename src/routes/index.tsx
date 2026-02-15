import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Auth/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import EquipoItemsPage from '@/pages/EquipoItems/EquipoItemsPage';
import EquipoItemDetailPage from '@/pages/EquipoItems/EquipoItemDetailPage';
import EquipoItemFormPage from '@/pages/EquipoItems/EquipoItemFormPage';
import MainLayout from '@/components/layout/MainLayout/MainLayout';
import PrivateRoute from './PrivateRoute';
import UserFormPage from '@/pages/Users/UserFormPage';
import UsersPage from '@/pages/Users/UsersPage';
import UserDetailPage from '@/pages/Users/UserDetailPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import OTsPage from '@/pages/OTs/OTsPage';
import OtFormPage from '@/pages/OTs/OtFormPage';
import OtDetailPage from '@/pages/OtDetailPage';
import CreateOtPage from '@/pages/OTs/CreateOtPage';
import TenantsPage from '@/pages/Tenants/TenantsPage';
import TenantDetailPage from '@/pages/Tenants/TenantDetailPage';
import TenantFormPage from '@/pages/Tenants/TenantFormPage';
import MyTenantPage from '@/pages/Tenants/MyTenantPage';
import CustomersPage from '@/pages/Customers/CustomersPage';
import CustomerFormPage from '@/pages/Customers/CustomerFormPage';
import CustomerDetailPage from '@/pages/Customers/CustomerDetailPage';
import ReportsPage from '@/pages/Reports/ReportsPage';
import ViewReportPage from '@/pages/Reports/ViewReportPage';
import ProtocolsPage from '@/pages/Protocols/ProtocolsPage';
import ProtocolFormPage from '@/pages/Protocols/ProtocolFormPage';
import ProtocolDetailPage from '@/pages/Protocols/ProtocolDetailPage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import HVEquipoPage from '@/pages/HVEquipo/HVEquipoPage';
import ActividadFormPage from '@/pages/Actividades/ActividadFormPage';
import ActividadesPage from '@/pages/Actividades/ActividadesPage';
import ItemsPage from '@/pages/Items/ItemsPage';
import ItemFormPage from '@/pages/Items/ItemFormPage';
import ItemDetailPage from '@/pages/Items/ItemDetailPage';
import CronogramasPage from '@/pages/Cronogramas/CronogramasPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        
        {/* Profile */}
        <Route path="profile" element={<ProfilePage />} />
        
        <Route path="equipo-items" element={<EquipoItemsPage />} />
        <Route path="equipo-items/new" element={<EquipoItemFormPage />} />
        <Route path="equipo-items/:id" element={<EquipoItemDetailPage />} />
        <Route path="equipo-items/:id/edit" element={<EquipoItemFormPage />} />

        {/* equipment alias routes (sidebar uses /equipment) */}
        <Route path="equipment" element={<EquipoItemsPage />} />
        <Route path="equipment/new" element={<EquipoItemFormPage />} />
        <Route path="equipment/:id" element={<EquipoItemDetailPage />} />
        <Route path="equipment/:id/edit" element={<EquipoItemFormPage />} />

        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />

        <Route path="ots" element={<OTsPage />} />
        <Route path="ots/new" element={<CreateOtPage />} />
        <Route path="ots/create" element={<CreateOtPage />} />
        <Route path="ots/:id" element={<OtDetailPage />} />
        <Route path="ots/:id/edit" element={<OtFormPage />} />

        {/* maintenance-orders alias (sidebar uses /maintenance-orders) */}
        <Route path="maintenance-orders" element={<OTsPage />} />
        <Route path="maintenance-orders/new" element={<CreateOtPage />} />
        <Route path="maintenance-orders/create" element={<CreateOtPage />} />
        <Route path="maintenance-orders/:id" element={<OtDetailPage />} />
        <Route path="maintenance-orders/:id/edit" element={<OtFormPage />} />

        {/* cronogramas */}
        <Route path="cronogramas" element={<CronogramasPage />} />

        {/* customers, reports, protocols, settings, hv-equipo */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<CustomerFormPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="customers/:id/edit" element={<CustomerFormPage />} />

        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:reporteId/view" element={<ViewReportPage />} />

        <Route path="protocols" element={<ProtocolsPage />} />
        <Route path="protocols/new" element={<ProtocolFormPage />} />
        <Route path="protocols/:id" element={<ProtocolDetailPage />} />
        <Route path="protocols/:id/edit" element={<ProtocolFormPage />} />

        <Route path="settings" element={<SettingsPage />} />

        <Route path="hv-equipo" element={<HVEquipoPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="items/new" element={<ItemFormPage />} />
        <Route path="items/:id" element={<ItemDetailPage />} />
        <Route path="items/:id/edit" element={<ItemFormPage />} />
        <Route path="actividades" element={<ActividadesPage />} />
        <Route path="actividades/new" element={<ActividadFormPage />} />
        <Route path="actividades/:id" element={<div>Actividad detalle (pendiente)</div>} />
        <Route path="actividades/:id/edit" element={<ActividadFormPage />} />

        {/* Tenants management pages */}
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/new" element={<TenantFormPage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="tenants/:id/edit" element={<TenantFormPage />} />
        
        {/* My Organization / Current Tenant */}
        <Route path="my-organization" element={<MyTenantPage />} />
        <Route path="my-tenant" element={<MyTenantPage />} />


        {/* Ot / Ordenes de Trabajo */}
        <Route path="ots" element={<OTsPage />} />
        <Route path="ots/new" element={<CreateOtPage />} />
        <Route path="ots/:id" element={<OtDetailPage />} />
        <Route path="ots/:id/edit" element={<OtFormPage />} />

        {/* hoja de vida de equipos */}
        <Route path="/hv-equipo/:equipoId" element={<HVEquipoPage />} />
      </Route>

      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
