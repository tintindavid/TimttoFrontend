import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({ permissions: new Set<string>(), comparativoCalls: 0 }));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'creator', email: 'x@y.co', role: 'user', roleId: 'r' } }) }));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({ has: (p: string) => mocks.permissions.has(p), hasAny: () => false, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useLicitacion', () => {
  const m = () => ({ mutateAsync: vi.fn(), isLoading: false });
  return {
    useQuitarProveedor: m,
    useCerrarCotizaciones: m,
    useAsignarProveedor: m,
    useAbrirLicitacion: m,
    useAmpliarFecha: m,
    useReenviarInvitacion: m,
    useRegistrarCotizacion: m,
    useCompraDirecta: m,
    useSeleccionarGanador: m,
    useGetComparativo: () => {
      mocks.comparativoCalls += 1;
      return { isLoading: false, isError: false, data: { data: { hayComparables: false, proveedores: [] } } };
    },
  };
});
vi.mock('@/hooks/useCustomers', () => ({ useCustomers: () => ({ data: { data: [] }, isLoading: false, isError: false }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import LicitacionPanel from './LicitacionPanel';

const req = (estado: Requisicion['estado']): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-1',
  titulo: 'T',
  tipoRequisicionId: 't',
  areaId: 'a',
  prioridad: 'Alta',
  estado,
  creadaPor: 'creator',
  montoEstimado: 1,
  version: 1,
  lineas: [],
  licitacion: {
    proveedores: [
      { _id: 'p1', proveedorId: 'c1', nombre: 'Con oferta', correoEnvio: null, tieneCotizacion: true, cotizacion: null, estadoEnvio: 'Aceptado' },
      { _id: 'p2', proveedorId: 'c2', nombre: 'Sin oferta', correoEnvio: null, tieneCotizacion: false, cotizacion: null, estadoEnvio: 'Enviado' },
    ],
  },
});

const renderPanel = (estado: Requisicion['estado']) =>
  render(
    <MemoryRouter>
      <LicitacionPanel requisicion={req(estado)} />
    </MemoryRouter>
  );

describe('LicitacionPanel for a viewer without purchasing permissions', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.comparativoCalls = 0;
  });

  it('shows a received badge without detail, and a dash instead of an empty e-mail', () => {
    renderPanel('En_Licitacion');
    expect(screen.getAllByText('Cotización recibida')).toHaveLength(1);
    expect(screen.getByText('Sin cotización')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText(/Versiones anteriores/)).not.toBeInTheDocument();
  });

  it('does not mount the comparativo nor offer winner selection', () => {
    renderPanel('Cotizacion_Recibida');
    expect(screen.queryByTestId('comparativo')).not.toBeInTheDocument();
    expect(mocks.comparativoCalls).toBe(0);
    expect(screen.queryByRole('button', { name: /Seleccionar ganador/ })).not.toBeInTheDocument();
  });

  it('mounts the comparativo for a user with select-winner', () => {
    mocks.permissions = new Set(['requisiciones:select-winner']);
    renderPanel('Cotizacion_Recibida');
    expect(screen.getByTestId('comparativo')).toBeInTheDocument();
  });
});
