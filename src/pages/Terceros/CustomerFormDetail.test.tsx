import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  customer: { current: undefined as unknown },
  create: { mutateAsync: vi.fn(), isLoading: false },
  update: { mutateAsync: vi.fn(), isLoading: false },
  navigate: vi.fn(),
  auth: { user: { role: 'admin' } },
}));

vi.mock('@/hooks/useCustomers', () => ({
  useCustomer: () => ({ data: mocks.customer.current, isLoading: false, error: null }),
  useCreateCustomer: () => mocks.create,
  useUpdateCustomer: () => mocks.update,
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/hooks/usePermission', () => ({ useHasPermission: () => true }));
vi.mock('@/components/customers/CustomerSedesSection', () => ({ default: () => <div /> }));
vi.mock('@/components/customers/CustomerServiciosSection', () => ({ default: () => <div /> }));
vi.mock('@/components/customers/CustomerEquiposSection', () => ({ default: () => <div /> }));
vi.mock('@/components/customers/CustomerOTsSection', () => ({ default: () => <div /> }));
vi.mock('@/components/customers/CustomerQrsSection', () => ({ default: () => <div /> }));
vi.mock('@/pages/Terceros/ClientTokensTab', () => ({ default: () => <div /> }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import CustomerFormPage from './CustomerFormPage';
import CustomerDetailPage from './CustomerDetailPage';

const base = { _id: 'x1', Razonsocial: 'ACME', Nit: 123, Email: 'a@a.co', Ciudad: 'Cali', Departamento: 'Valle' };

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/terceros/new" element={<CustomerFormPage />} />
        <Route path="/terceros/:id" element={<CustomerDetailPage />} />
        <Route path="/terceros/:id/edit" element={<CustomerFormPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.create.mutateAsync.mockReset().mockResolvedValue({});
  mocks.update.mutateAsync.mockReset().mockResolvedValue({});
  mocks.navigate.mockReset();
  mocks.customer.current = undefined;
});

describe('CustomerFormPage by kind', () => {
  it('creating a provider hides the logo, sends kind=provider and returns to the provider tab', async () => {
    const { container } = renderAt('/terceros/new?kind=provider');
    expect(screen.getByText('Nuevo proveedor')).toBeTruthy();
    expect(screen.queryByText('Logo del Cliente')).toBeNull();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(mocks.create.mutateAsync).toHaveBeenCalled());
    const fd = mocks.create.mutateAsync.mock.calls[0][0] as FormData;
    expect(fd.get('kind')).toBe('provider');
    expect(mocks.navigate).toHaveBeenCalledWith('/terceros?tab=provider');
  });

  it('creating a client shows the logo field and sends kind=customer', async () => {
    const { container } = renderAt('/terceros/new');
    expect(screen.getByText('Logo del Cliente')).toBeTruthy();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(mocks.create.mutateAsync).toHaveBeenCalled());
    expect((mocks.create.mutateAsync.mock.calls[0][0] as FormData).get('kind')).toBe('customer');
    expect(mocks.navigate).toHaveBeenCalledWith('/terceros');
  });

  it('editing a provider hides the logo and does not send kind', async () => {
    mocks.customer.current = { data: { ...base, kind: 'provider' } };
    const { container } = renderAt('/terceros/x1/edit');
    expect(screen.queryByText('Logo del Cliente')).toBeNull();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(mocks.update.mutateAsync).toHaveBeenCalled());
    expect((mocks.update.mutateAsync.mock.calls[0][0].data as FormData).has('kind')).toBe(false);
  });
});

describe('CustomerDetailPage by kind', () => {
  it('provider shows only Información General', () => {
    mocks.customer.current = { data: { ...base, kind: 'provider' } };
    renderAt('/terceros/x1');
    expect(screen.getByRole('tab', { name: 'Información General' })).toBeTruthy();
    for (const name of ['Sedes', 'Servicios', 'Equipos', 'Órdenes de Trabajo', 'QRs', 'Accesos cliente']) {
      expect(screen.queryByRole('tab', { name })).toBeNull();
    }
    expect(screen.getByText('Editar proveedor')).toBeTruthy();
  });

  it('client (and legacy docs without kind) show all tabs', () => {
    mocks.customer.current = { data: { ...base } };
    renderAt('/terceros/x1');
    for (const name of ['Información General', 'Sedes', 'Servicios', 'Equipos', 'Órdenes de Trabajo', 'QRs', 'Accesos cliente']) {
      expect(screen.getByRole('tab', { name })).toBeTruthy();
    }
  });
});
