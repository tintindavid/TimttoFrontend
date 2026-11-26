import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlatformTenantDetailPage from './PlatformTenantDetailPage';

const retry = vi.fn();
let seedStatus: 'pending' | 'ready' | 'error' = 'error';

vi.mock('./TenantCapabilitiesPanel', () => ({ default: () => <div /> }));
vi.mock('@/hooks/usePlatformTenants', () => {
  const idle = () => ({ mutate: vi.fn(), isLoading: false });
  return {
    useSuspendTenant: idle,
    useReactivateTenant: idle,
    useSoftDeleteTenant: idle,
    useUpdateTenantMetadata: idle,
    useRetryDemoSeed: () => ({ mutate: retry, isLoading: false }),
    useGetPlatformTenant: () => ({
      isLoading: false,
      isError: false,
      data: {
        tenant: {
          _id: 't1', tenantId: 'demo-1', name: 'Demo 1', status: 'active', isDeleted: false,
          createdAt: '2026-11-26', updatedAt: '2026-11-26',
          demo: { enabled: true, seedStatus, limits: { users: 2, customers: 3, equipos: 50, pdfPerDocument: 2 } },
        },
        counters: { usersCount: 1, customersCount: 1, equiposCount: 15, otsAbiertas: 3 },
      },
    }),
  };
});

const renderPage = () => render(
  <MemoryRouter initialEntries={['/admin/tenants/t1']}>
    <Routes><Route path="/admin/tenants/:id" element={<PlatformTenantDetailPage />} /></Routes>
  </MemoryRouter>,
);

describe('PlatformTenantDetailPage — demo account', () => {
  beforeEach(() => { retry.mockClear(); });

  it('offers to retry the sample data when seeding failed', () => {
    seedStatus = 'error';
    renderPage();
    expect(screen.getByText('Demo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar datos de ejemplo' }));
    expect(retry).toHaveBeenCalledWith('t1');
  });

  it('shows no retry button when the sample data is ready', () => {
    seedStatus = 'ready';
    renderPage();
    expect(screen.getByText(/Datos de ejemplo cargados/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reintentar datos de ejemplo' })).toBeNull();
  });
});
