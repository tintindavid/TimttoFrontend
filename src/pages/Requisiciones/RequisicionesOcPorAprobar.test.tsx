import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  useGetRequisiciones: vi.fn(),
  count: vi.fn(),
  permissions: new Set<string>(),
  navigate: vi.fn(),
}));

// E5: the export buttons use mutations; these suites render without a QueryClient.
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarListado: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarComparativo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({ useGetRequisiciones: mocks.useGetRequisiciones }));
vi.mock('@/hooks/useOrdenCompra', () => ({ useOcPorAprobarCount: mocks.count }));
vi.mock('@/hooks/useAreas', () => ({ useGetAreas: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useTiposRequisicion', () => ({ useGetTiposRequisicion: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (p: string) => mocks.permissions.has(p),
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import RequisicionesListPage from './RequisicionesListPage';

const row = (): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0001',
  titulo: 'Rodamientos',
  tipoRequisicionId: { _id: 't1', nombre: 'Repuestos' } as never,
  areaId: { _id: 'a1', nombre: 'Mantenimiento' } as never,
  prioridad: 'Alta',
  estado: 'OC_Emitida',
  creadaPor: { _id: 'u1', firstName: 'Ana', lastName: 'Ruiz' } as never,
  lineas: [],
  montoEstimado: 1500000,
  version: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
});

const listResult = (rows: Requisicion[]) => ({
  data: { data: rows, pagination: { page: 1, limit: 20, total: rows.length, pages: 1, hasNext: false, hasPrev: false } },
  isLoading: false,
  isFetching: false,
  isError: false,
});

const renderPage = (vista: 'mias' | 'oc-por-aprobar' = 'mias') =>
  render(
    <MemoryRouter>
      <RequisicionesListPage vista={vista} />
    </MemoryRouter>
  );

describe('"OC por aprobar" tray', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.useGetRequisiciones.mockReset().mockReturnValue(listResult([row()]));
    mocks.count.mockReset().mockReturnValue({ data: 3 });
    mocks.navigate.mockReset();
  });

  it('hides the tab (and never asks for the counter) without requisiciones:approve-po', () => {
    renderPage();
    expect(screen.queryByText('OC por aprobar')).not.toBeInTheDocument();
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('shows the tab with the pending counter and navigates to the tray', () => {
    mocks.permissions = new Set(['requisiciones:approve-po']);
    renderPage();
    expect(screen.getByLabelText('3 órdenes de compra por aprobar')).toHaveTextContent('3');
    fireEvent.click(screen.getByText(/^OC por aprobar/, { selector: 'a' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/requisiciones/oc-por-aprobar');
  });

  it('omits the counter badge when nothing is pending', () => {
    mocks.permissions = new Set(['requisiciones:approve-po']);
    mocks.count.mockReturnValue({ data: 0 });
    renderPage();
    expect(screen.queryByLabelText(/órdenes de compra por aprobar/)).not.toBeInTheDocument();
  });

  it('queries the oc-por-aprobar view and lists the purchase orders with their estado badge', () => {
    mocks.permissions = new Set(['requisiciones:approve-po']);
    renderPage('oc-por-aprobar');
    expect(mocks.useGetRequisiciones).toHaveBeenCalledWith(expect.objectContaining({ vista: 'oc-por-aprobar' }));
    expect(screen.getByText('REQ-2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('OC emitida').length).toBeGreaterThan(0);
  });

  it('has its own empty message', () => {
    mocks.permissions = new Set(['requisiciones:approve-po']);
    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    renderPage('oc-por-aprobar');
    expect(screen.getByText('No tienes órdenes de compra pendientes por aprobar.')).toBeInTheDocument();
  });
});
