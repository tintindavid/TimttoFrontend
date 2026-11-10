import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

const mocks = vi.hoisted(() => ({ ampliar: vi.fn(), comparativo: [] as unknown[] }));

// E5: the export buttons use mutations; these suites render without a QueryClient.
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarListado: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarComparativo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'me', email: 'x@y.co', role: 'user', roleId: 'r' } }) }));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({ has: () => true, hasAny: () => true, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useLicitacion', () => ({
  useQuitarProveedor: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCerrarCotizaciones: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAsignarProveedor: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAbrirLicitacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useAmpliarFecha: () => ({ mutateAsync: mocks.ampliar, isLoading: false }),
  useReenviarInvitacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useRegistrarCotizacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCompraDirecta: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useSeleccionarGanador: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useGetComparativo: () => ({ isLoading: false, isError: false, data: { data: { hayComparables: false, proveedores: mocks.comparativo } } }),
}));
vi.mock('@/hooks/useCustomers', () => ({ useCustomers: () => ({ data: { data: [] }, isLoading: false, isError: false }) }));
vi.mock('@/components/customers/CrearProveedorModal', () => ({ default: () => null }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import LicitacionPanel from './LicitacionPanel';

const prov = (id: string, over = {}) => ({
  _id: id,
  proveedorId: `c-${id}`,
  nombre: `Prov ${id}`,
  correoEnvio: `${id}@p.co`,
  estadoEnvio: 'Enviado' as const,
  ...over,
});

const req = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-1',
  titulo: 'T',
  tipoRequisicionId: 't',
  areaId: 'a',
  prioridad: 'Alta',
  estado: 'En_Licitacion',
  creadaPor: 'other',
  montoEstimado: 1,
  moneda: 'COP',
  version: 1,
  lineas: [],
  licitacion: { proveedores: [prov('p1'), prov('p2')] },
  ...over,
});

const renderPanel = (r: Requisicion) =>
  render(
    <MemoryRouter>
      <LicitacionPanel requisicion={r} />
    </MemoryRouter>
  );

describe('LicitacionPanel (round 2)', () => {
  beforeEach(() => {
    mocks.comparativo = [];
    mocks.ampliar.mockReset().mockResolvedValue({});
  });

  it('extends the deadline from a small modal', async () => {
    const user = userEvent.setup();
    renderPanel(req());
    await user.click(screen.getByRole('button', { name: 'Ampliar fecha límite' }));
    const input = screen.getByLabelText('Nueva fecha límite *');
    const future = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    await user.type(input, `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T10:00`);
    await user.click(screen.getByRole('button', { name: 'Guardar fecha' }));
    expect(mocks.ampliar).toHaveBeenCalledWith({ id: 'r1', data: { fechaLimiteCotizacion: expect.any(String) } });
  });

  it('does not offer to extend outside En_Licitacion', () => {
    renderPanel(req({ estado: 'Aprobada' }));
    expect(screen.queryByRole('button', { name: 'Ampliar fecha límite' })).not.toBeInTheDocument();
  });

  it('shows the instructions and a compact list of previous quotation versions', () => {
    renderPanel(
      req({
        licitacion: {
          instrucciones: 'Entrega en bodega',
          proveedores: [
            prov('p1', {
              estadoEnvio: 'Aceptado',
              cotizacion: {
                observacion: 'v2',
                fechaRespuesta: '2026-11-03T10:00:00.000Z',
                versiones: [{ fechaRespuesta: '2026-11-02T10:00:00.000Z', observacion: 'primera oferta', origen: 'portal' }],
              },
            }),
            prov('p2'),
          ],
        },
      })
    );
    expect(screen.getByText('Entrega en bodega')).toBeInTheDocument();
    expect(screen.getByText('Versiones anteriores (1)')).toBeInTheDocument();
    expect(screen.getByText(/primera oferta/)).toBeInTheDocument();
  });

  it('offers Quitar in En_Licitacion only for suppliers without a quotation', () => {
    renderPanel(req({ licitacion: { proveedores: [prov('p1', { cotizacion: { observacion: 'x' } }), prov('p2')] } }));
    expect(screen.queryByRole('button', { name: 'Quitar proveedor Prov p1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar proveedor Prov p2' })).toBeInTheDocument();
  });

  it('opens with two valid e-mails even if a third supplier has none', () => {
    renderPanel(req({ estado: 'Aprobada', licitacion: { proveedores: [prov('p1'), prov('p2'), prov('p3', { correoEnvio: undefined })] } }));
    expect(screen.getByRole('button', { name: 'Abrir licitación' })).toBeInTheDocument();
  });

  it('only offers winner selection on rows with a quotation and renders unsafe links as text', () => {
    mocks.comparativo = [
      { paId: 'p1', nombre: 'Con oferta', estadoEnvio: 'Aceptado', linkPropuesta: 'https://trusted@evil.test/x', fechaRespuesta: '2026-11-02T10:00:00.000Z' },
      { paId: 'p2', nombre: 'Sin oferta', estadoEnvio: 'Aceptado' },
      { paId: 'p3', nombre: 'Peligrosa', estadoEnvio: 'Aceptado', linkPropuesta: 'javascript:alert(1)', observacion: 'o' },
    ];
    renderPanel(req({ estado: 'Cotizacion_Recibida' }));
    expect(screen.getByRole('button', { name: 'Seleccionar ganador Con oferta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Seleccionar ganador Sin oferta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
  });
});

describe('licitacion error messages', () => {
  it.each([
    ['NOTIFICACIONES_DESACTIVADAS', /desactivado en este entorno/],
    ['PUBLIC_APP_URL_NO_CONFIGURADA', /no está configurada/],
    ['PROVEEDOR_CON_COTIZACION', /cotización registrada/],
    ['LIMITE_PROVEEDORES', /máximo/],
    ['LINK_INVALIDO', /https/],
  ])('maps %s to Spanish', (code, pattern) => {
    expect(getRequisicionErrorMessage({ response: { data: { error: { code } } } })).toMatch(pattern);
  });
});
