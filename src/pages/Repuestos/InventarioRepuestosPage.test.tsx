import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  list: vi.fn(),
  rows: [] as unknown[],
  total: 0,
}));

vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: mocks.can }),
}));
vi.mock('@/hooks/useInventarioRepuestos', () => ({
  useInventarioList: (params: unknown) => {
    mocks.list(params);
    return {
      data: { data: mocks.rows, pagination: { page: 1, limit: 20, total: mocks.total, pages: 1 } },
      isLoading: false,
      isFetching: false,
      isError: false,
    };
  },
  useCreateInventarioRepuesto: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateInventarioRepuesto: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteInventarioRepuesto: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useInventarioMovimientos', () => ({
  useInventarioMovimientos: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  useCreateInventarioMovimiento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

import InventarioRepuestosPage from './InventarioRepuestosPage';

const setCaps = (basic: boolean, advanced: boolean) =>
  mocks.can.mockImplementation((c: string) =>
    c === 'usesInventoryBasic' ? basic : c === 'usesInventoryAdvanced' ? advanced : true
  );

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <InventarioRepuestosPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const item = {
  _id: 'i1',
  nombre: 'Filtro de aceite',
  tipo: 'repuesto',
  activo: true,
  referencia: 'FA-1',
  stockActual: 3,
  stockMinimo: 5,
  unidad: 'unidades',
  precio: 100,
};

beforeEach(() => {
  mocks.list.mockReset();
  mocks.rows = [item];
  mocks.total = 1;
});

describe('InventarioRepuestosPage', () => {
  it('basic level shows only the catalog (no stock columns or movement actions)', () => {
    setCaps(true, false);
    renderPage();

    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Filtro de aceite')).toBeInTheDocument();
    expect(screen.queryByText('Stock mínimo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar movimiento/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Solo stock bajo')).not.toBeInTheDocument();
    // server-side params of table-listing-standards
    expect(mocks.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, limit: 20, sortBy: 'nombre', order: 'asc', stockBajo: undefined })
    );
  });

  it('advanced level shows quantities, movement and history actions', () => {
    setCaps(true, true);
    renderPage();

    expect(screen.getByText('Stock mínimo')).toBeInTheDocument();
    expect(screen.getByText('Stock bajo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar movimiento de Filtro de aceite' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial de Filtro de aceite' }));
    expect(screen.getByText(/Historial de movimientos/)).toBeInTheDocument();
  });

  it('shows the counter and the empty states', () => {
    setCaps(true, false);
    renderPage();
    expect(screen.getByText('Mostrando 1 de 1 ítems')).toBeInTheDocument();
  });

  it('empty catalog shows the first-use message', () => {
    setCaps(true, false);
    mocks.rows = [];
    mocks.total = 0;
    renderPage();
    expect(screen.getByText('Aún no hay ítems en el catálogo.')).toBeInTheDocument();
  });

  it('toggling the order sends order=desc and the search is sent debounced', async () => {
    setCaps(true, false);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Ordenar A–Z/ }));
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ order: 'desc' })));
    fireEvent.change(screen.getByLabelText('Buscar ítems por nombre'), { target: { value: 'fil' } });
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'fil' })));
  });

  it('opens the create modal with name and type only in basic level', () => {
    setCaps(true, false);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Crear ítem' }));
    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo *')).toBeInTheDocument();
    expect(screen.queryByLabelText('Precio')).not.toBeInTheDocument();
  });
});
