import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'me', email: 'x@y.co', role: 'user', roleId: 'role-1' } }),
}));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({ has: () => true, hasAny: () => true, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({
  useRegistrarRecepcion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useConfirmarEntrega: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCerrarLinea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import RecepcionPanel from './RecepcionPanel';

const base = (estado: Requisicion['estado']): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0011',
  titulo: 'Acero',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado,
  creadaPor: 'creator',
  montoEstimado: 100,
  version: 1,
  lineas: [{ _id: 'l1', descripcion: 'Barra', unidad: 'und', cantidadSolicitada: 2, precioEstimado: 50, estadoLinea: 'Pendiente' }],
  recepciones: [],
});

const renderPanel = (estado: Requisicion['estado']) =>
  render(
    <MemoryRouter>
      <RecepcionPanel requisicion={base(estado)} />
    </MemoryRouter>
  );

describe('RecepcionPanel with a licitacion', () => {
  it.each(['En_Licitacion', 'Cotizacion_Recibida'] as const)('blocks reception and explains why in %s', (estado) => {
    renderPanel(estado);
    expect(screen.getByTestId('recepcion-licitacion-abierta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar recepción' })).not.toBeInTheDocument();
  });

  it.each(['Adjudicada', 'OC_Emitida', 'OC_En_Reaprobacion', 'OC_Aprobada'] as const)(
    'needs the purchase order sent before reception in %s',
    (estado) => {
      renderPanel(estado);
      expect(screen.queryByTestId('recepcion-licitacion-abierta')).not.toBeInTheDocument();
      expect(screen.getByTestId('recepcion-oc-requerida')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Registrar recepción' })).not.toBeInTheDocument();
    }
  );

  it('allows reception once the purchase order was sent (OC_Enviada)', () => {
    renderPanel('OC_Enviada');
    expect(screen.queryByTestId('recepcion-oc-requerida')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar recepción' })).toBeInTheDocument();
  });

  it('allows reception in Aprobada (no purchase) without the purchase-order notice', () => {
    renderPanel('Aprobada');
    expect(screen.queryByTestId('recepcion-oc-requerida')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar recepción' })).toBeInTheDocument();
  });
});
