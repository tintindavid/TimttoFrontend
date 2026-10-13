import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  useCustomers: vi.fn(),
  deleteMutation: { mutateAsync: vi.fn() },
  navigate: vi.fn(),
}));

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: mocks.useCustomers,
  useDeleteCustomer: () => mocks.deleteMutation,
}));
vi.mock('@/services/customer.service', () => ({ customerService: { exportCSV: vi.fn() } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import TercerosPage from './TercerosPage';

const LocationProbe = () => <div data-testid="loc">{useLocation().search}</div>;

const renderPage = (url = '/terceros') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/terceros" element={<><TercerosPage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.useCustomers.mockReset();
  mocks.useCustomers.mockImplementation((params: { kind: string }) => ({
    data: {
      data:
        params.kind === 'provider'
          ? [{ _id: 'p1', Razonsocial: 'Proveedor Uno', Nit: 1 }]
          : [{ _id: 'c1', Razonsocial: 'Cliente Uno', Nit: 2 }],
      pagination: { total: 1, pages: 1 },
    },
    isLoading: false,
    isFetching: false,
    error: null,
  }));
});

describe('TercerosPage', () => {
  it('shows the Clientes tab by default and requests kind=customer', () => {
    renderPage();
    expect(screen.getByText('Cliente Uno')).toBeTruthy();
    expect(screen.queryByText('Proveedor Uno')).toBeNull();
    expect(mocks.useCustomers.mock.calls.every(([p]) => p.kind === 'customer')).toBe(true);
    expect(screen.getByRole('button', { name: /Exportar CSV/ })).toBeTruthy();
  });

  it('lists providers on ?tab=provider and creates a provider', () => {
    renderPage('/terceros?tab=provider');
    expect(screen.getByText('Proveedor Uno')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Exportar CSV/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Nuevo proveedor/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/terceros/new?kind=provider');
  });

  it('switches tab, updates the URL and the create button creates a client', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: 'Proveedores' }));
    expect(screen.getByText('Proveedor Uno')).toBeTruthy();
    expect(screen.getByTestId('loc').textContent).toBe('?tab=provider');
    fireEvent.click(screen.getByRole('tab', { name: 'Clientes' }));
    fireEvent.click(screen.getByRole('button', { name: /Crear Cliente/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/terceros/new');
  });

  it('shows a per-tab empty state', () => {
    mocks.useCustomers.mockReturnValue({
      data: { data: [], pagination: { total: 0, pages: 1 } },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage('/terceros?tab=provider');
    expect(screen.getByText('Aún no hay proveedores registrados.')).toBeTruthy();
  });
});
