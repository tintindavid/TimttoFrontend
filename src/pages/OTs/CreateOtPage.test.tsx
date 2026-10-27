import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  managesCustomers: true,
  organizationCustomerId: 'org1' as string | null,
  createOt: vi.fn(),
  useCustomers: vi.fn(),
  useEquipoItems: vi.fn(),
}));

vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({
    can: (c: string) => (c === 'managesCustomers' ? mocks.managesCustomers : true),
    organizationCustomerId: mocks.organizationCustomerId,
  }),
}));
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: mocks.useCustomers,
  useCreateCustomer: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/useSedes', () => ({ useSedesByCustomer: () => ({ data: { data: [] }, isLoading: false }) }));
vi.mock('@/hooks/useServicios', () => ({ useServiciosByCustomer: () => ({ data: { data: [] }, isLoading: false }) }));
vi.mock('@/hooks/useEquipoItems', () => ({ useEquipoItems: mocks.useEquipoItems }));
vi.mock('@/hooks/useOTs', () => ({ useCreateOt: () => ({ mutateAsync: mocks.createOt }) }));
vi.mock('@/components/equipos/EquipoForm', () => ({ __esModule: true, default: () => null }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('sweetalert2', () => ({ __esModule: true, default: { fire: vi.fn() } }));

import CreateOtPage from './CreateOtPage';

const equipo = {
  _id: 'eq1',
  item: 'EQ-1',
  Serie: 'S1',
  ItemId: { Nombre: 'Monitor' },
  SedeId: { _id: 's1' },
  Servicio: { _id: 'sv1' },
  mesesMtto: ['ene'],
  Estado: 'Activo',
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <CreateOtPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  mocks.managesCustomers = true;
  mocks.organizationCustomerId = 'org1';
  mocks.createOt.mockReset().mockResolvedValue({ data: { _id: 'ot1' } });
  mocks.useCustomers.mockReset().mockReturnValue({
    data: { data: [{ _id: 'c1', Razonsocial: 'Cliente Uno', Ciudad: 'Bogotá', Email: 'a@b.co' }] },
    isLoading: false,
  });
  mocks.useEquipoItems.mockReset().mockImplementation((filters: unknown) => ({
    data: { data: filters ? [equipo] : [] },
    isLoading: false,
    refetch: vi.fn(),
  }));
});

describe('CreateOtPage - Gestiona clientes', () => {
  it('shows the required client selector when the tenant manages customers and hides the equipment until one is chosen', () => {
    renderPage();
    expect(screen.getByText(/Cliente/, { selector: 'label' })).toBeTruthy();
    expect(screen.getByText('Escriba para buscar cliente...')).toBeTruthy();
    expect(screen.queryByText('Selección de Equipos', { exact: false })).toBeNull();
    expect(mocks.useCustomers.mock.calls[0][1]).toEqual({ enabled: true });
  });

  it('own maintenance: no client selector, equipment is loaded for the organization and the payload has no ClienteId', async () => {
    mocks.managesCustomers = false;
    renderPage();

    expect(screen.queryByText('Escriba para buscar cliente...')).toBeNull();
    expect(screen.queryByRole('button', { name: /Nuevo/ })).toBeNull();
    expect(mocks.useCustomers.mock.calls[0][1]).toEqual({ enabled: false });
    expect(await screen.findByText('Monitor')).toBeTruthy();
    expect(mocks.useEquipoItems).toHaveBeenCalledWith({ ClienteId: 'org1' });

    fireEvent.click(screen.getByText('Monitor'));
    fireEvent.click(screen.getByRole('button', { name: /Crear Orden de Trabajo/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(mocks.createOt).toHaveBeenCalledTimes(1));
    const payload = mocks.createOt.mock.calls[0][0];
    expect(payload).not.toHaveProperty('ClienteId');
    expect(payload.equipos).toEqual(['eq1']);
  });
});
