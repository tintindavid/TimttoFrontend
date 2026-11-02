import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  userId: 'me',
  quitar: vi.fn(),
  cerrar: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: mocks.userId, email: 'x@y.co', role: 'user', roleId: 'role-1' } }),
}));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: () => false,
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useLicitacion', () => ({
  useQuitarProveedor: () => ({ mutateAsync: mocks.quitar, isLoading: false }),
  useCerrarCotizaciones: () => ({ mutateAsync: mocks.cerrar, isLoading: false }),
  useAsignarProveedor: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAbrirLicitacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAmpliarFecha: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useReenviarInvitacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useRegistrarCotizacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCompraDirecta: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useSeleccionarGanador: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useGetComparativo: () => ({
    isLoading: false,
    isError: false,
    data: {
      data: {
        hayComparables: true,
        proveedores: [
          { paId: 'p1', nombre: 'Aceros SA', estadoEnvio: 'Aceptado', valorTotal: 900, moneda: 'COP', masEconomica: true },
          { paId: 'p2', nombre: 'Barras SAS', estadoEnvio: 'Aceptado', valorTotal: 1200, moneda: 'COP' },
        ],
      },
    },
  }),
}));
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'c1', Razonsocial: 'Aceros SA', Email: 'a@aceros.co' }] }, isLoading: false, isError: false }),
}));
vi.mock('@/components/customers/CrearProveedorModal', () => ({ default: () => null }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import LicitacionPanel from './LicitacionPanel';

const proveedor = (id: string, nombre: string, over = {}) => ({
  _id: id,
  proveedorId: `c-${id}`,
  nombre,
  correoEnvio: `${id}@prov.co`,
  estadoEnvio: 'Pendiente' as const,
  vistasCount: 0,
  ...over,
});

const requisicion = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0010',
  titulo: 'Acero',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado: 'Aprobada',
  creadaPor: 'creator',
  montoEstimado: 1000,
  moneda: 'COP',
  version: 2,
  lineas: [],
  licitacion: { proveedores: [proveedor('p1', 'Aceros SA'), proveedor('p2', 'Barras SAS')] },
  ...over,
});

const renderPanel = (req: Requisicion) =>
  render(
    <MemoryRouter>
      <LicitacionPanel requisicion={req} />
    </MemoryRouter>
  );

describe('LicitacionPanel', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['requisiciones:manage-suppliers', 'requisiciones:select-winner']);
    mocks.userId = 'me';
    mocks.quitar.mockReset().mockResolvedValue({});
    mocks.cerrar.mockReset().mockResolvedValue({});
  });

  it('lets a buyer assign suppliers and open the licitacion once there are two active ones', () => {
    renderPanel(requisicion());
    expect(screen.getByRole('button', { name: 'Asignar proveedor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir licitación' })).toBeInTheDocument();
    expect(screen.getByText('Aceros SA')).toBeInTheDocument();
  });

  it('does not offer to open with fewer than two active suppliers', () => {
    renderPanel(requisicion({ licitacion: { proveedores: [proveedor('p1', 'Aceros SA')] } }));
    expect(screen.queryByRole('button', { name: 'Abrir licitación' })).not.toBeInTheDocument();
  });

  it('hides every purchasing action without the permissions', () => {
    mocks.permissions = new Set();
    renderPanel(requisicion());
    expect(screen.queryByRole('button', { name: 'Asignar proveedor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compra directa' })).not.toBeInTheDocument();
  });

  it('hides direct purchase from the creator (segregation of duties)', () => {
    mocks.userId = 'creator';
    renderPanel(requisicion());
    expect(screen.queryByRole('button', { name: 'Compra directa' })).not.toBeInTheDocument();
  });

  it('removes a supplier while the requisicion is only Aprobada', async () => {
    const user = userEvent.setup();
    renderPanel(requisicion());
    await user.click(screen.getByRole('button', { name: 'Quitar proveedor Aceros SA' }));
    expect(mocks.quitar).toHaveBeenCalledWith({ id: 'r1', paId: 'p1' });
  });

  it('closes quotations after confirmation when at least one quotation arrived', async () => {
    const user = userEvent.setup();
    const req = requisicion({
      estado: 'En_Licitacion',
      licitacion: {
        fechaLimiteCotizacion: '2026-12-01T10:00:00.000Z',
        proveedores: [
          proveedor('p1', 'Aceros SA', { estadoEnvio: 'Aceptado', cotizacion: { observacion: 'Oferta', fechaRespuesta: '2026-11-02T10:00:00.000Z' } }),
          proveedor('p2', 'Barras SAS', { estadoEnvio: 'Enviado' }),
        ],
      },
    });
    renderPanel(req);
    expect(screen.getByRole('button', { name: 'Reenviar invitación a Barras SAS' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar cotizaciones' }));
    await user.click(screen.getAllByRole('button', { name: 'Cerrar cotizaciones' }).pop() as HTMLElement);
    expect(mocks.cerrar).toHaveBeenCalledWith('r1');
  });

  it('shows the comparison with the cheapest highlighted and a select-winner button', () => {
    renderPanel(requisicion({ estado: 'Cotizacion_Recibida' }));
    expect(screen.getByText('Más económica')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seleccionar ganador Aceros SA' })).toBeInTheDocument();
  });

  it('does not offer winner selection without the select-winner permission', () => {
    mocks.permissions = new Set(['requisiciones:manage-suppliers']);
    renderPanel(requisicion({ estado: 'Cotizacion_Recibida' }));
    expect(screen.queryByRole('button', { name: /Seleccionar ganador/ })).not.toBeInTheDocument();
  });

  it('requires two steps and an explicit acknowledgement to confirm the winner', async () => {
    const user = userEvent.setup();
    renderPanel(requisicion({ estado: 'Cotizacion_Recibida' }));
    await user.click(screen.getByRole('button', { name: 'Seleccionar ganador Aceros SA' }));
    expect(screen.queryByRole('button', { name: 'Confirmar ganador' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const confirm = screen.getByRole('button', { name: 'Confirmar ganador' });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(confirm).toBeEnabled();
  });

  it('requires a 20-character justification for direct purchase', async () => {
    const user = userEvent.setup();
    renderPanel(requisicion());
    await user.click(screen.getByRole('button', { name: 'Compra directa' }));
    await user.selectOptions(screen.getByLabelText('Proveedor *'), 'c1');
    await user.type(screen.getByLabelText('Justificación *'), 'muy corta');
    expect(screen.getByRole('button', { name: 'Registrar compra directa' })).toBeDisabled();
    await user.type(screen.getByLabelText('Justificación *'), ' pero ahora sí es suficiente');
    expect(screen.getByRole('button', { name: 'Registrar compra directa' })).toBeEnabled();
  });
});
