import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OrdenCompra } from '@/types/ordenCompra.types';
import type { NivelAprobacion, Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  userId: 'approver',
  aprobar: vi.fn(),
  rechazar: vi.fn(),
  enviar: vi.fn(),
  reenviar: vi.fn(),
  pdf: vi.fn(),
  save: vi.fn(),
  toastError: vi.fn(),
}));

// E5: the export buttons use mutations; these suites render without a QueryClient.
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarListado: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarComparativo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: mocks.userId, email: 'x@y.co', role: 'user', roleId: 'role-1' } }),
}));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useOrdenCompra', () => ({
  useAprobarOrdenCompra: () => ({ mutateAsync: mocks.aprobar, isLoading: false }),
  useRechazarOrdenCompra: () => ({ mutateAsync: mocks.rechazar, isLoading: false }),
  useEnviarOrdenCompra: () => ({ mutateAsync: mocks.enviar, isLoading: false }),
  useReenviarOrdenCompra: () => ({ mutateAsync: mocks.reenviar, isLoading: false }),
  useDescargarOrdenCompraPdf: () => ({ mutateAsync: mocks.pdf, isLoading: false }),
  useEmitirOrdenCompra: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useEditarOrdenCompra: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/utils/saveBlob', () => ({ saveBlob: mocks.save }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: mocks.toastError, warning: vi.fn() } }));

import OrdenCompraPanel from './OrdenCompraPanel';

const oc = (over: Partial<OrdenCompra> = {}): OrdenCompra => ({
  numero: 'OC-2026-0007',
  version: 2,
  estado: 'Emitida',
  lineas: [{ lineaId: 'l1', descripcion: 'Rodamiento', cantidad: 4, precioUnitario: 300, subtotal: 1200 }],
  total: 1200,
  moneda: 'COP',
  condiciones: 'Pago a 30 días',
  fechaEntrega: '2026-12-15T00:00:00.000Z',
  requiereEntregables: false,
  emitidaPor: { usuarioId: 'issuer', nombre: 'Ivan Emisor' },
  emitidaEn: '2026-11-01T10:00:00.000Z',
  exceso: { requerido: false, estimado: 1000, total: 1200, margenPct: 10 },
  ...over,
});

const nivel = (over: Partial<NivelAprobacion> = {}): NivelAprobacion => ({
  orden: 2,
  nombre: 'Dirección',
  estado: 'Pendiente',
  aprobadorTipo: 'usuarios',
  aprobadorIds: ['approver'],
  ...over,
});

const req = (estado: Requisicion['estado'], ordenCompra?: OrdenCompra | null, over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Rodamientos',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado,
  creadaPor: 'creator',
  montoEstimado: 1000,
  moneda: 'COP',
  version: 3,
  lineas: [{ _id: 'l1', descripcion: 'Rodamiento', unidad: 'und', cantidadSolicitada: 4, precioEstimado: 250 }],
  ordenCompra,
  ...over,
});

const renderPanel = (requisicion: Requisicion) => render(<OrdenCompraPanel requisicion={requisicion} />);

describe('OrdenCompraPanel', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.userId = 'approver';
    mocks.aprobar.mockReset().mockResolvedValue({});
    mocks.rechazar.mockReset().mockResolvedValue({});
    mocks.enviar.mockReset().mockResolvedValue({});
    mocks.reenviar.mockReset().mockResolvedValue({});
    mocks.pdf.mockReset().mockResolvedValue(new Blob(['pdf']));
    mocks.save.mockReset();
    mocks.toastError.mockReset();
  });

  describe('issuing', () => {
    it('offers "Emitir orden de compra" in Adjudicada only with requisiciones:issue-po', () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      renderPanel(req('Adjudicada'));
      expect(screen.getByRole('button', { name: 'Emitir orden de compra' })).toBeInTheDocument();
      expect(screen.getByText(/Aún no se ha emitido|Emite la orden de compra/)).toBeInTheDocument();
    });

    it('hides the issue action without the permission', () => {
      renderPanel(req('Adjudicada'));
      expect(screen.queryByRole('button', { name: 'Emitir orden de compra' })).not.toBeInTheDocument();
      expect(screen.getByText('Aún no se ha emitido la orden de compra.')).toBeInTheDocument();
    });

    it('opens the issue modal with blank unit prices', async () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      const user = userEvent.setup();
      renderPanel(req('Adjudicada'));
      await user.click(screen.getByRole('button', { name: 'Emitir orden de compra' }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Precio unitario de Rodamiento')).toHaveValue(null);
    });
  });

  describe('content', () => {
    it('shows number, version, status, total vs estimate and the conditions', () => {
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.getByText('OC-2026-0007')).toBeInTheDocument();
      expect(screen.getByTestId('oc-version')).toHaveTextContent('Versión 2');
      expect(screen.getByText('Emitida')).toBeInTheDocument();
      expect(screen.getByTestId('oc-total').textContent).toContain('1.200');
      expect(screen.getByTestId('oc-estimado').textContent).toContain('1.000');
      expect(screen.getByText('Pago a 30 días')).toBeInTheDocument();
      expect(screen.queryByTestId('oc-exceso')).not.toBeInTheDocument();
    });

    it('warns about the excess with the margin when re-approval is required', () => {
      renderPanel(
        req(
          'OC_En_Reaprobacion',
          oc({
            estado: 'En_Reaprobacion',
            exceso: { requerido: true, estimado: 1000, total: 1500, margenPct: 10 },
            aprobacion: { niveles: [nivel()], nivelActual: 2 },
          })
        )
      );
      const warning = screen.getByTestId('oc-exceso');
      expect(warning).toHaveTextContent('margen de 10 %');
      expect(warning).toHaveTextContent('reaprobación');
      expect(screen.getByLabelText('Niveles de reaprobación')).toHaveTextContent('Dirección');
    });

    it('explains the excess when the requisicion had no estimate', () => {
      renderPanel(req('OC_En_Reaprobacion', oc({ estado: 'En_Reaprobacion', exceso: { requerido: true, estimado: 0, total: 900, margenPct: 10 } })));
      expect(screen.getByTestId('oc-exceso')).toHaveTextContent('no tenía monto estimado');
    });

    it('lists the version history built from the timeline', () => {
      renderPanel(
        req('OC_Emitida', oc(), {
          timeline: [
            { eventId: 'e1', tipo: 'OC_EMITIDA', fecha: '2026-11-01T10:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Ivan Emisor' }, datos: { version: 1 } },
            { eventId: 'e2', tipo: 'OC_RECHAZADA', fecha: '2026-11-02T10:00:00.000Z', actor: { tipo: 'usuario', nombre: 'Ana' }, observacion: 'Precio alto' },
            { eventId: 'e3', tipo: 'CREADA', fecha: '2026-10-01T10:00:00.000Z', actor: { tipo: 'sistema' } },
          ],
        })
      );
      expect(screen.getByText('Historial de la orden (2)')).toBeInTheDocument();
      expect(screen.getByText(/Precio alto/)).toBeInTheDocument();
    });
  });

  describe('approve / reject gating', () => {
    it('shows approve and reject to an approver who is not the issuer', () => {
      mocks.permissions = new Set(['requisiciones:approve-po']);
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.getByRole('button', { name: 'Aprobar orden' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rechazar orden' })).toBeInTheDocument();
    });

    it('hides them without requisiciones:approve-po', () => {
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rechazar orden' })).not.toBeInTheDocument();
    });

    it('hides them from the issuer (separation of duties)', () => {
      mocks.permissions = new Set(['requisiciones:approve-po', 'requisiciones:issue-po']);
      mocks.userId = 'issuer';
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Rechazar orden' })).not.toBeInTheDocument();
    });

    const reaprobacion = (niveles: NivelAprobacion[] = [nivel()]) =>
      req('OC_En_Reaprobacion', oc({ estado: 'En_Reaprobacion', aprobacion: { niveles, nivelActual: 2 } }));

    it('decides a reapproval level with approve-po or with the E1 approve permission when eligible', () => {
      mocks.permissions = new Set(['requisiciones:approve-po']);
      const { unmount } = renderPanel(reaprobacion());
      expect(screen.getByRole('button', { name: 'Aprobar orden' })).toBeInTheDocument();
      unmount();
      mocks.permissions = new Set(['requisiciones:approve']);
      renderPanel(reaprobacion());
      expect(screen.getByRole('button', { name: 'Aprobar orden' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Rechazar orden' })).toBeInTheDocument();
    });

    it('hides the reapproval buttons when the user is not eligible for the current level', () => {
      mocks.permissions = new Set(['requisiciones:approve-po', 'requisiciones:approve']);
      renderPanel(reaprobacion([nivel({ aprobadorIds: ['someone-else'] })]));
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
    });

    it('hides the reapproval buttons from the issuer and from who already decided another level', () => {
      mocks.permissions = new Set(['requisiciones:approve-po']);
      mocks.userId = 'issuer';
      const { unmount } = renderPanel(reaprobacion([nivel({ aprobadorIds: ['issuer'] })]));
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
      unmount();
      mocks.userId = 'approver';
      renderPanel(reaprobacion([nivel({ orden: 1, estado: 'Aprobado', decididoPor: 'approver', aprobadorIds: ['approver'] }), nivel()]));
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
    });

    it('needs a reapproval permission in OC_En_Reaprobacion even when listed', () => {
      mocks.permissions = new Set();
      renderPanel(reaprobacion());
      expect(screen.queryByRole('button', { name: 'Aprobar orden' })).not.toBeInTheDocument();
    });

    it('approves with the requisicion id', async () => {
      mocks.permissions = new Set(['requisiciones:approve-po']);
      const user = userEvent.setup();
      renderPanel(req('OC_Emitida', oc()));
      await user.click(screen.getByRole('button', { name: 'Aprobar orden' }));
      await waitFor(() => expect(mocks.aprobar).toHaveBeenCalledWith({ id: 'r1', data: { version: 2 } }));
    });

    it('requires an observation to reject', async () => {
      mocks.permissions = new Set(['requisiciones:approve-po']);
      const user = userEvent.setup();
      renderPanel(req('OC_Emitida', oc()));
      await user.click(screen.getByRole('button', { name: 'Rechazar orden' }));
      const dialog = await screen.findByRole('dialog');
      const confirm = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Rechazar orden') as HTMLButtonElement;
      expect(confirm).toBeDisabled();
      await user.type(screen.getByRole('textbox'), 'Precio fuera de contrato');
      expect(confirm).toBeEnabled();
      await user.click(confirm);
      await waitFor(() =>
        expect(mocks.rechazar).toHaveBeenCalledWith({ id: 'r1', data: { observacion: 'Precio fuera de contrato', version: 2 } })
      );
    });
  });

  describe('edit / send / resend', () => {
    it('lets the issuer edit while OC_Emitida, but not another user without manage-all', () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      mocks.userId = 'issuer';
      const { unmount } = renderPanel(req('OC_Emitida', oc()));
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
      unmount();
      mocks.userId = 'someone-else';
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });

    it('lets manage-all edit someone else\'s order', () => {
      mocks.permissions = new Set(['requisiciones:issue-po', 'requisiciones:manage-all']);
      renderPanel(req('OC_Emitida', oc()));
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });

    it('never edits an approved or sent order', () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      mocks.userId = 'issuer';
      renderPanel(req('OC_Aprobada', oc({ estado: 'Aprobada' })));
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });

    it('sends an approved order after confirming', async () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      const user = userEvent.setup();
      renderPanel(req('OC_Aprobada', oc({ estado: 'Aprobada' })));
      await user.click(screen.getByRole('button', { name: 'Enviar al proveedor' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Enviar') as HTMLButtonElement);
      await waitFor(() => expect(mocks.enviar).toHaveBeenCalledWith('r1'));
    });

    it('does not offer sending without issue-po', () => {
      renderPanel(req('OC_Aprobada', oc({ estado: 'Aprobada' })));
      expect(screen.queryByRole('button', { name: 'Enviar al proveedor' })).not.toBeInTheDocument();
    });

    it('resends the e-mail of a sent order and flags a mail failure', async () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      const user = userEvent.setup();
      renderPanel(req('OC_Enviada', oc({ estado: 'Enviada', envio: { enviadaEn: '2026-11-03T10:00:00.000Z', estadoCorreo: 'Fallido' } })));
      expect(screen.getByText(/El correo al proveedor falló/)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Reenviar correo' }));
      await waitFor(() => expect(mocks.reenviar).toHaveBeenCalledWith({ id: 'r1' }));
    });

    it('also offers resending once reception started (En_Recepcion)', () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      renderPanel(req('En_Recepcion', oc({ estado: 'Enviada', envio: { enviadaEn: '2026-11-03T10:00:00.000Z', estadoCorreo: 'Enviado' } })));
      expect(screen.getByRole('button', { name: 'Reenviar correo' })).toBeInTheDocument();
    });

    it('asks for the supplier e-mail (validated) when there was none on file and sends correoEnvio', async () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      const user = userEvent.setup();
      renderPanel(req('OC_Enviada', oc({ estado: 'Enviada', envio: { enviadaEn: '2026-11-03T10:00:00.000Z', estadoCorreo: 'Sin_correo' } })));
      await user.click(screen.getByRole('button', { name: 'Reenviar correo' }));
      expect(mocks.reenviar).not.toHaveBeenCalled();
      const dialog = await screen.findByRole('dialog');
      const send = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Enviar') as HTMLButtonElement;
      expect(send).toBeDisabled();
      await user.type(screen.getByLabelText(/Correo del proveedor/), 'no-es-correo');
      expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
      expect(send).toBeDisabled();
      await user.clear(screen.getByLabelText(/Correo del proveedor/));
      await user.type(screen.getByLabelText(/Correo del proveedor/), 'ventas@proveedor.co');
      await user.click(send);
      await waitFor(() => expect(mocks.reenviar).toHaveBeenCalledWith({ id: 'r1', correoEnvio: 'ventas@proveedor.co' }));
    });

    it('maps CORREO_INVALIDO from the server', async () => {
      mocks.permissions = new Set(['requisiciones:issue-po']);
      mocks.reenviar.mockRejectedValue({ response: { data: { error: { code: 'CORREO_INVALIDO' } } } });
      const user = userEvent.setup();
      renderPanel(req('OC_Enviada', oc({ estado: 'Enviada', envio: { enviadaEn: '2026-11-03T10:00:00.000Z', estadoCorreo: 'Sin_correo' } })));
      await user.click(screen.getByRole('button', { name: 'Reenviar correo' }));
      await user.type(await screen.findByLabelText(/Correo del proveedor/), 'a@b.co');
      const dialog = screen.getByRole('dialog');
      await user.click(Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Enviar') as HTMLButtonElement);
      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('El correo indicado no es válido.'));
    });
  });

  describe('PDF', () => {
    it('downloads the PDF named after the order number', async () => {
      const user = userEvent.setup();
      renderPanel(req('OC_Emitida', oc()));
      await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));
      await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.any(Blob), 'OC-2026-0007.pdf'));
    });

    it('shows the mapped Spanish error when the PDF service is down', async () => {
      mocks.pdf.mockRejectedValue({ response: { data: { error: { code: 'PDF_NO_DISPONIBLE' } } } });
      const user = userEvent.setup();
      renderPanel(req('OC_Emitida', oc()));
      await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));
      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('PDF de la orden de compra no está disponible')));
      expect(mocks.save).not.toHaveBeenCalled();
    });

    it('has no PDF button before an order exists', () => {
      renderPanel(req('Adjudicada'));
      expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
    });
  });
});
