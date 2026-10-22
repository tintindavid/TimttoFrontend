import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  list: vi.fn(),
  createItem: vi.fn(),
  createSolicitud: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'u1' }, token: 't' }) }));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: mocks.can }),
}));
vi.mock('@/services/inventarioRepuesto.service', () => ({
  inventarioRepuestoService: {
    list: mocks.list,
    create: (...args: unknown[]) => mocks.createItem(...args),
    update: vi.fn(),
  },
}));
vi.mock('@/hooks/useRepuestos', () => ({
  useCreateRepuestoSolicitud: () => ({ mutateAsync: mocks.createSolicitud, error: null }),
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { SolicitarRepuestoModal } from './SolicitarRepuestoModal';

const setCaps = (basic: boolean) =>
  mocks.can.mockImplementation((c: string) => (c === 'usesInventoryBasic' ? basic : false));

const renderModal = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SolicitarRepuestoModal show onHide={vi.fn()} reporteId="r1" otId="o1" equipoId="e1" />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  localStorage.clear();
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.list.mockResolvedValue({ data: [{ _id: 'i1', nombre: 'Filtro', tipo: 'repuesto', activo: true }] });
});

describe('SolicitarRepuestoModal', () => {
  it('without the capability keeps the free text input and ignores localStorage.tenantPlan', () => {
    localStorage.setItem('tenantPlan', 'premium-inventario');
    setCaps(false);
    renderModal();

    expect(screen.getByPlaceholderText(/Filtro de aceite, Bomba hidráulica/)).toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('with the capability searches the catalog server-side and offers "Crear nuevo repuesto"', async () => {
    setCaps(true);
    renderModal();

    await waitFor(() => expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 })));
    fireEvent.keyDown(screen.getByLabelText('Nombre del repuesto'), { key: 'ArrowDown' });
    expect(await screen.findByText('Filtro')).toBeInTheDocument();
    expect(screen.getByText('+ Crear nuevo repuesto')).toBeInTheDocument();
  });

  it('creating a new part selects it and keeps the other request fields', async () => {
    setCaps(true);
    mocks.createItem.mockResolvedValue({ data: { _id: 'new1', nombre: 'Banda nueva', tipo: 'accesorio' } });
    renderModal();

    fireEvent.change(screen.getByPlaceholderText(/Ej: 2, 1 unidad/), { target: { value: '7' } });
    fireEvent.keyDown(screen.getByLabelText('Nombre del repuesto'), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByText('+ Crear nuevo repuesto'));

    fireEvent.change(await screen.findByLabelText('Nombre *'), { target: { value: 'Banda nueva' } });
    fireEvent.change(screen.getByLabelText('Tipo *'), { target: { value: 'accesorio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(mocks.createItem).toHaveBeenCalledWith({ nombre: 'Banda nueva', tipo: 'accesorio' })
    );
    expect(await screen.findByText('Banda nueva')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ej: 2, 1 unidad/)).toHaveValue('7');
    expect(mocks.createSolicitud).not.toHaveBeenCalled();
  });
});
