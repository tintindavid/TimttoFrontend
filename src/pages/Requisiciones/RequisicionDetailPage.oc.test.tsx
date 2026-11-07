import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { OrdenCompra } from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  detail: { data: undefined as unknown, isLoading: false, isError: false, refetch: vi.fn() },
  permissions: new Set<string>(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'me', email: 'x@y.co', role: 'user', roleId: 'role-1' } }),
}));
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (p: string) => mocks.permissions.has(p),
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({
  useGetRequisicion: () => mocks.detail,
  useAprobarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useRechazarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCancelarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCambiarEstadoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useEnviarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
// Panels are covered by their own tests; here only the visibility rules of the detail page matter.
vi.mock('./components/ApprovalPanel', () => ({ default: () => <div data-testid="approval-stub" /> }));
vi.mock('./components/LicitacionPanel', () => ({ default: () => <div data-testid="licitacion-stub" /> }));
vi.mock('./components/RecepcionPanel', () => ({ default: () => <div data-testid="recepcion-stub" /> }));
vi.mock('./components/OrdenCompraPanel', () => ({ default: () => <div data-testid="oc-stub" /> }));
vi.mock('./components/EntregablesPanel', () => ({ default: () => <div data-testid="entregables-stub" /> }));

import RequisicionDetailPage from './RequisicionDetailPage';

const oc = (over: Partial<OrdenCompra> = {}): OrdenCompra => ({
  numero: 'OC-2026-0001',
  version: 1,
  estado: 'Enviada',
  lineas: [],
  total: 100,
  requiereEntregables: false,
  ...over,
});

const req = (estado: Requisicion['estado'], ordenCompra?: OrdenCompra): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado,
  creadaPor: 'creator',
  montoEstimado: 100,
  version: 1,
  lineas: [],
  ordenCompra,
});

const renderPage = (requisicion: Requisicion) => {
  mocks.detail.data = { data: requisicion };
  return render(
    <MemoryRouter initialEntries={['/requisiciones/r1']}>
      <Routes>
        <Route path="/requisiciones/:id" element={<RequisicionDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RequisicionDetailPage purchase-order blocks', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
  });

  it('shows the OC block in Adjudicada only to who can issue it', () => {
    const { unmount } = renderPage(req('Adjudicada'));
    expect(screen.queryByTestId('oc-stub')).not.toBeInTheDocument();
    unmount();
    mocks.permissions = new Set(['requisiciones:issue-po']);
    renderPage(req('Adjudicada'));
    expect(screen.getByTestId('oc-stub')).toBeInTheDocument();
  });

  it.each(['OC_Emitida', 'OC_En_Reaprobacion', 'OC_Aprobada', 'OC_Enviada'] as const)('shows the OC block and keeps the purchasing panel in %s', (estado) => {
    renderPage(req(estado, oc()));
    expect(screen.getByTestId('oc-stub')).toBeInTheDocument();
    expect(screen.getByTestId('licitacion-stub')).toBeInTheDocument();
    expect(screen.getByTestId('recepcion-stub')).toBeInTheDocument();
  });

  it('shows the OC block when an order exists even after reception started', () => {
    renderPage(req('En_Recepcion', oc()));
    expect(screen.getByTestId('oc-stub')).toBeInTheDocument();
  });

  it('shows no OC block for a requisicion without purchase (module flows unchanged)', () => {
    renderPage(req('Aprobada'));
    expect(screen.queryByTestId('oc-stub')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entregables-stub')).not.toBeInTheDocument();
  });

  it('shows deliverables only when the order requires them and it was sent', () => {
    const { unmount } = renderPage(req('OC_Enviada', oc({ requiereEntregables: false })));
    expect(screen.queryByTestId('entregables-stub')).not.toBeInTheDocument();
    unmount();
    const second = renderPage(req('OC_Aprobada', oc({ estado: 'Aprobada', requiereEntregables: true })));
    expect(screen.queryByTestId('entregables-stub')).not.toBeInTheDocument();
    second.unmount();
    renderPage(req('En_Recepcion', oc({ requiereEntregables: true })));
    expect(screen.getByTestId('entregables-stub')).toBeInTheDocument();
  });
});
