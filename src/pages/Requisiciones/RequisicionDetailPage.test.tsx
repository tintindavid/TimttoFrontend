import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  detail: { data: undefined as unknown, isLoading: false, isError: false, refetch: vi.fn() },
  reasignar: vi.fn(),
  permissions: new Set<string>(),
  userId: 'boss',
  aprobar: vi.fn(),
  rechazar: vi.fn(),
  cancelar: vi.fn(),
  cambiarEstado: vi.fn(),
  enviar: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: mocks.userId, email: 'x@y.co', role: 'user', roleId: 'role-1' } }),
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
vi.mock('@/hooks/usePresupuestosArea', () => ({
  useGetPresupuestoResumen: (params: { periodo: string }) => ({
    isLoading: false,
    isError: false,
    data: {
      data: params.periodo.length === 4
        ? { configurado: true, periodo: params.periodo, monto: 10000, consumido: 6000, comprometido: 3000, disponible: 1000, porcentaje: 90, umbralAlerta: 80, alerta: true, sobrepasado: false }
        : { configurado: false, monto: null, consumido: 0, comprometido: 0, disponible: null, porcentaje: null, alerta: false, sobrepasado: false },
    },
  }),
}));
vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ data: { data: [{ _id: 'dir', firstName: 'Dora', lastName: 'Directora', email: 'd@x.co' }] } }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({
  useReasignarAprobadores: () => ({ mutateAsync: mocks.reasignar, isLoading: false }),
  useGetRequisicion: () => mocks.detail,
  useAprobarRequisicion: () => ({ mutateAsync: mocks.aprobar, isLoading: false }),
  useRechazarRequisicion: () => ({ mutateAsync: mocks.rechazar, isLoading: false }),
  useCancelarRequisicion: () => ({ mutateAsync: mocks.cancelar, isLoading: false }),
  useCambiarEstadoRequisicion: () => ({ mutateAsync: mocks.cambiarEstado, isLoading: false }),
  useEnviarRequisicion: () => ({ mutateAsync: mocks.enviar, isLoading: false }),
  useDeleteRequisicion: () => ({ mutateAsync: mocks.remove, isLoading: false }),
  useRegistrarRecepcion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useConfirmarEntrega: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCerrarLinea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
import { toast } from 'react-toastify';

import RequisicionDetailPage from './RequisicionDetailPage';

const requisicion = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0007',
  titulo: 'Bomba',
  tipoRequisicionId: { _id: 't1', nombre: 'Repuestos' } as never,
  areaId: { _id: 'a1', nombre: 'Mantenimiento' } as never,
  prioridad: 'Alta',
  estado: 'En_Aprobacion',
  creadaPor: 'creator',
  solicitanteId: 'creator',
  montoEstimado: 300,
  version: 4,
  lineas: [{ descripcion: 'Rodamiento', unidad: 'und', cantidadSolicitada: 3, precioEstimado: 100 }],
  aprobacion: {
    nivelActual: 1,
    niveles: [
      { orden: 1, nombre: 'Jefe de área', aprobadorTipo: 'jefe_area', aprobadorIds: ['boss'], estado: 'Pendiente' },
      { orden: 2, nombre: 'Dirección', aprobadorTipo: 'usuarios', aprobadorIds: ['dir'], estado: 'Pendiente' },
    ],
  },
  timeline: [
    { tipo: 'CREADA', fecha: '2026-10-01T10:00:00.000Z', actor: { tipo: 'usuario', usuarioId: { _id: 'creator', firstName: 'Ana', lastName: 'Ruiz' } } },
    { tipo: 'ENVIADA', fecha: '2026-10-01T11:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Ana Ruiz' }, estadoAnterior: 'Borrador', estadoNuevo: 'Enviada' },
    { tipo: 'APROBACION_SOLICITADA', fecha: '2026-10-01T11:00:01.000Z', actor: { tipo: 'sistema' } },
  ],
  ...over,
});

const renderDetail = (req: Requisicion) => {
  mocks.detail = { data: { data: req }, isLoading: false, isError: false, refetch: mocks.detail.refetch };
  return render(
    <MemoryRouter initialEntries={['/requisiciones/r1']}>
      <Routes>
        <Route path="/requisiciones/:id" element={<RequisicionDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RequisicionDetailPage', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.userId = 'boss';
    mocks.detail.refetch = vi.fn().mockResolvedValue({});
    Object.values(mocks).forEach((m) => typeof m === 'function' && 'mockReset' in m && (m as ReturnType<typeof vi.fn>).mockReset());
    mocks.aprobar.mockResolvedValue({});
    mocks.rechazar.mockResolvedValue({});
    mocks.cancelar.mockResolvedValue({});
    mocks.cambiarEstado.mockResolvedValue({});
  });

  it('renders header, lines, approval levels, budget alert and the timeline', () => {
    renderDetail(requisicion());
    expect(screen.getByText(/REQ-2026-0007 · Bomba/)).toBeInTheDocument();
    expect(screen.getByText('Rodamiento')).toBeInTheDocument();
    expect(screen.getAllByTestId('nivel-row')).toHaveLength(2);
    expect(screen.getByText('Nivel actual')).toBeInTheDocument();
    expect(screen.getByTestId('budget-summary')).toBeInTheDocument();
    expect(screen.getByText(/alcanzó el umbral de alerta/)).toBeInTheDocument();
    const events = screen.getAllByTestId('timeline-event');
    expect(events).toHaveLength(3);
    expect(events[0]).toHaveTextContent('Requisición creada');
    expect(events[0]).toHaveTextContent('Ana Ruiz');
    expect(events[2]).toHaveTextContent('Sistema');
  });

  it('offers approve/reject to the current-level approver with permission', () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    renderDetail(requisicion());
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
  });

  it('hides approve/reject without the permission', () => {
    renderDetail(requisicion());
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
  });

  it('hides approve/reject for a user who is not the level approver', () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    mocks.userId = 'someone-else';
    renderDetail(requisicion());
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
  });

  it('hides approve/reject for the creator', () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    mocks.userId = 'creator';
    renderDetail(requisicion({ aprobacion: { nivelActual: 1, niveles: [{ orden: 1, aprobadorTipo: 'jefe_area', aprobadorIds: ['creator'], estado: 'Pendiente' }] } }));
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
  });

  it('approves the current level', async () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    renderDetail(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    await waitFor(() => expect(mocks.aprobar).toHaveBeenCalledWith({ id: 'r1', data: { version: 4 } }));
  });

  it('requires an observation to reject', async () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    const user = userEvent.setup();
    renderDetail(requisicion());
    await user.click(screen.getByRole('button', { name: 'Rechazar' }));
    const modalConfirm = within(await screen.findByRole('dialog')).getByRole('button', { name: 'Rechazar' });
    expect(modalConfirm).toBeDisabled();
    await user.type(screen.getByLabelText(/^Observación/), 'Falta cotización');
    expect(modalConfirm).toBeEnabled();
    await user.click(modalConfirm);
    await waitFor(() => expect(mocks.rechazar).toHaveBeenCalledWith({ id: 'r1', data: { version: 4, observacion: 'Falta cotización' } }));
  });

  it('lets the creator withdraw an in-approval requisicion back to draft', async () => {
    mocks.userId = 'creator';
    const user = userEvent.setup();
    renderDetail(requisicion());
    await user.click(screen.getByRole('button', { name: 'Retirar' }));
    await user.type(screen.getByLabelText(/^Observación/), 'Corregir líneas');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }));
    await waitFor(() =>
      expect(mocks.cambiarEstado).toHaveBeenCalledWith({ id: 'r1', data: { estado: 'Borrador', observacion: 'Corregir líneas' } })
    );
  });

  it('lets the creator reopen a rejected requisicion', () => {
    mocks.userId = 'creator';
    renderDetail(requisicion({ estado: 'Rechazada' }));
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirar' })).not.toBeInTheDocument();
  });

  it('shows a warning toast per advertencia returned when reopening', async () => {
    mocks.userId = 'creator';
    mocks.cambiarEstado.mockResolvedValue({
      data: { advertencias: ['Línea A retirada', { mensaje: 'Línea B retirada' }, { descripcion: 'Bomba', motivo: 'ya pertenece a REQ-9' }] },
    });
    const user = userEvent.setup();
    renderDetail(requisicion({ estado: 'Rechazada' }));
    await user.click(screen.getByRole('button', { name: 'Reabrir' }));
    await user.type(screen.getByLabelText(/^Observación/), 'Reintentar');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reabrir' }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledTimes(3));
    expect(toast.warning).toHaveBeenCalledWith('Línea A retirada');
    expect(toast.warning).toHaveBeenCalledWith('Línea B retirada');
    expect(toast.warning).toHaveBeenCalledWith('Línea «Bomba» retirada: ya pertenece a REQ-9');
    expect(toast.success).toHaveBeenCalledWith('Requisición reabierta.');
  });

  it('requires a reason to cancel and gates the button by permission', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDetail(requisicion());
    expect(screen.queryByRole('button', { name: 'Cancelar requisición' })).not.toBeInTheDocument();
    unmount();
    mocks.permissions = new Set(['requisiciones:cancel']);
    renderDetail(requisicion());
    await user.click(screen.getByRole('button', { name: 'Cancelar requisición' }));
    await user.type(screen.getByLabelText(/Motivo de la cancelación/), 'Ya no se necesita');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar requisición' }));
    await waitFor(() => expect(mocks.cancelar).toHaveBeenCalledWith({ id: 'r1', data: { motivo: 'Ya no se necesita' } }));
  });

  it('shows edit and send only for drafts with permission', () => {
    mocks.permissions = new Set(['requisiciones:update', 'requisiciones:send']);
    mocks.userId = 'creator';
    renderDetail(requisicion({ estado: 'Borrador', aprobacion: { nivelActual: null, niveles: [] } }));
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('hides send from a user who is neither creator nor requester', () => {
    mocks.permissions = new Set(['requisiciones:update', 'requisiciones:send']);
    mocks.userId = 'someone-else';
    renderDetail(requisicion({ estado: 'Borrador', aprobacion: { nivelActual: null, niveles: [] } }));
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('shows no actions on a cancelled requisicion', () => {
    mocks.permissions = new Set(['requisiciones:cancel', 'requisiciones:update', 'requisiciones:send']);
    renderDetail(requisicion({ estado: 'Cancelada' }));
    expect(screen.queryByRole('button', { name: 'Cancelar requisición' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('on a stale version (409) shows the Spanish message and refetches', async () => {
    mocks.permissions = new Set(['requisiciones:approve']);
    mocks.aprobar.mockRejectedValue({ response: { data: { message: 'x', error: { code: 'VERSION_DESACTUALIZADA' } } } });
    renderDetail(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'La requisición cambió mientras la revisabas. Recarga para ver la versión actual.'
      )
    );
    expect(mocks.detail.refetch).toHaveBeenCalled();
  });

  it('hides edit/send/delete of a draft from a non-owner even with permissions', () => {
    mocks.permissions = new Set(['requisiciones:update', 'requisiciones:send', 'requisiciones:delete']);
    mocks.userId = 'someone-else';
    renderDetail(requisicion({ estado: 'Borrador', aprobacion: { nivelActual: null, niveles: [] } }));
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('lets a manage-all user edit, send and delete a draft that is not theirs', () => {
    mocks.permissions = new Set(['requisiciones:update', 'requisiciones:send', 'requisiciones:delete', 'requisiciones:manage-all']);
    mocks.userId = 'someone-else';
    renderDetail(requisicion({ estado: 'Borrador', aprobacion: { nivelActual: null, niveles: [] } }));
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('shows Reasignar aprobadores only with manage-all while En_Aprobacion and submits the selection', async () => {
    const { unmount } = renderDetail(requisicion());
    expect(screen.queryByRole('button', { name: 'Reasignar aprobadores' })).not.toBeInTheDocument();
    unmount();
    mocks.permissions = new Set(['requisiciones:manage-all']);
    const { unmount: unmount2 } = renderDetail(requisicion({ estado: 'Aprobada' }));
    expect(screen.queryByRole('button', { name: 'Reasignar aprobadores' })).not.toBeInTheDocument();
    unmount2();
    mocks.reasignar.mockResolvedValue({});
    renderDetail(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Reasignar aprobadores' }));
    const dialog = await screen.findByRole('dialog');
    // The acting user (boss, current approver) is not selectable: the selection starts empty.
    expect(within(dialog).getByRole('button', { name: 'Reasignar' })).toBeDisabled();
    await userEvent.click(within(dialog).getByLabelText('Aprobadores *'));
    await userEvent.click(await screen.findByText('Dora Directora'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reasignar' }));
    await waitFor(() =>
      expect(mocks.reasignar).toHaveBeenCalledWith({ id: 'r1', data: { nivelOrden: 1, aprobadorIds: ['dir'] } })
    );
  });

  it('renders populated names: approvers, decided-by and timeline actor', () => {
    renderDetail(
      requisicion({
        solicitanteId: { _id: 'creator', firstName: 'Ana', lastName: 'Ruiz' } as never,
        aprobacion: {
          nivelActual: 2,
          niveles: [
            {
              orden: 1,
              aprobadorTipo: 'jefe_area',
              aprobadorIds: [{ _id: 'boss', firstName: 'Beto', lastName: 'Jefe' }],
              estado: 'Aprobado',
              decididoPor: { _id: 'boss', firstName: 'Beto', lastName: 'Jefe' },
              fecha: '2026-10-02T10:00:00.000Z',
            },
            { orden: 2, aprobadorTipo: 'usuarios', aprobadorIds: [{ _id: 'dir', firstName: 'Dora', lastName: 'Directora' }], estado: 'Pendiente' },
          ],
        },
      })
    );
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('Repuestos')).toBeInTheDocument();
    expect(screen.getAllByText(/Beto Jefe/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Dora Directora/)).toBeInTheDocument();
    expect(screen.getAllByText('Ana Ruiz').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the levels of a reopened Borrador as previous round, never as active', () => {
    mocks.userId = 'boss';
    renderDetail(requisicion({ estado: 'Borrador' }));
    expect(screen.getByTestId('previous-round')).toBeInTheDocument();
    expect(screen.queryByText('Nivel actual')).not.toBeInTheDocument();
  });
});

describe('RequisicionDetailPage help hints', () => {
  beforeEach(() => {
    mocks.userId = 'boss';
  });

  it('shows hints on the header, panels, approval levels, budget and the timeline events', () => {
    mocks.permissions = new Set();
    renderDetail(requisicion());
    [
      'Ayuda: Detalle de la requisición',
      'Ayuda: Estados de una requisición',
      'Ayuda: Datos generales',
      'Ayuda: Solicitante',
      'Ayuda: Líneas de la requisición',
      'Ayuda: Monto estimado',
      'Ayuda: Panel de aprobación',
      'Ayuda: Niveles de aprobación',
      'Ayuda: Presupuesto del área',
      'Ayuda: Historial',
      'Ayuda: Requisición creada',
      'Ayuda: Requisición enviada',
      'Ayuda: Aprobación solicitada',
    ].forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('shows the approver actions hints (Aprobar, Rechazar, Cancelar) next to their buttons', () => {
    mocks.permissions = new Set(['requisiciones:approve', 'requisiciones:cancel']);
    renderDetail(requisicion());
    ['Ayuda: Aprobar', 'Ayuda: Rechazar', 'Ayuda: Cancelar requisición'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: 'Ayuda: Enviar' })).not.toBeInTheDocument();
  });

  it('shows the owner actions hints on a draft (Editar, Enviar, Eliminar)', () => {
    mocks.permissions = new Set(['requisiciones:update', 'requisiciones:send', 'requisiciones:delete']);
    mocks.userId = 'creator';
    renderDetail(requisicion({ estado: 'Borrador' }));
    ['Ayuda: Editar', 'Ayuda: Enviar', 'Ayuda: Eliminar'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
  });

  it('shows the Retirar hint for the creator and the Reasignar hint for a supervisor', () => {
    mocks.permissions = new Set(['requisiciones:manage-all']);
    mocks.userId = 'creator';
    renderDetail(requisicion());
    expect(screen.getByRole('button', { name: 'Ayuda: Retirar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ayuda: Reasignar aprobadores' })).toBeInTheDocument();
  });

  it('shows the Reabrir hint on a rejected requisicion for its creator', () => {
    mocks.permissions = new Set();
    mocks.userId = 'creator';
    renderDetail(requisicion({ estado: 'Rechazada' }));
    expect(screen.getByRole('button', { name: 'Ayuda: Reabrir' })).toBeInTheDocument();
  });
});

describe('RequisicionDetailPage reception panel', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.userId = 'boss';
    mocks.detail.refetch = vi.fn().mockResolvedValue({});
  });

  it.each(['Aprobada', 'En_Recepcion', 'Cerrada'] as const)('shows the Recepción panel when the requisicion is %s', (estado) => {
    renderDetail(requisicion({ estado, recepciones: [] }));
    expect(screen.getByTestId('recepcion-panel')).toBeInTheDocument();
  });

  it.each(['Borrador', 'En_Aprobacion', 'Rechazada', 'Cancelada'] as const)('hides the Recepción panel when the requisicion is %s', (estado) => {
    renderDetail(requisicion({ estado }));
    expect(screen.queryByTestId('recepcion-panel')).not.toBeInTheDocument();
  });

  it('cannot cancel a closed requisicion and labels the new timeline events', () => {
    mocks.permissions = new Set(['requisiciones:cancel']);
    renderDetail(
      requisicion({
        estado: 'Cerrada',
        timeline: [
          { tipo: 'RECEPCION_REGISTRADA', fecha: '2026-10-02T10:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Rita' } },
          { tipo: 'ENTREGA_CONFIRMADA', fecha: '2026-10-02T11:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Ana' } },
          { tipo: 'ENTREGA_DISPUTADA', fecha: '2026-10-02T12:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Ana' } },
          { tipo: 'LINEA_CERRADA', fecha: '2026-10-02T13:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Rita' } },
          { tipo: 'LINEA_CANCELADA', fecha: '2026-10-02T14:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Rita' } },
          { tipo: 'CERRADA', fecha: '2026-10-02T15:00:00.000Z', actor: { tipo: 'sistema' }, estadoAnterior: 'En_Recepcion', estadoNuevo: 'Cerrada' },
        ],
      })
    );
    expect(screen.queryByRole('button', { name: 'Cancelar requisición' })).not.toBeInTheDocument();
    const events = screen.getAllByTestId('timeline-event');
    expect(events.map((e) => e.querySelector('.fw-semibold')?.textContent)).toEqual([
      'Recepción registrada',
      'Entrega confirmada',
      'Entrega en disputa',
      'Línea cerrada con faltante',
      'Línea cancelada',
      'Requisición cerrada',
    ]);
    expect(events[5]).toHaveTextContent('En recepción → Cerrada');
  });
});
