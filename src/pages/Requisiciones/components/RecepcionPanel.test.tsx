import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  userId: 'me',
  registrar: vi.fn(),
  confirmar: vi.fn(),
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
vi.mock('@/hooks/useRequisiciones', () => ({
  useRegistrarRecepcion: () => ({ mutateAsync: mocks.registrar, isLoading: false }),
  useConfirmarEntrega: () => ({ mutateAsync: mocks.confirmar, isLoading: false }),
  useCerrarLinea: () => ({ mutateAsync: mocks.cerrar, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import RecepcionPanel from './RecepcionPanel';

const requisicion = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0009',
  titulo: 'Repuestos',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado: 'En_Recepcion',
  creadaPor: 'creator',
  solicitanteId: 'creator',
  montoEstimado: 500,
  version: 3,
  lineas: [
    { _id: 'l1', descripcion: 'Rodamiento', unidad: 'und', cantidadSolicitada: 3, precioEstimado: 100, estadoLinea: 'Recibida_Parcial', cantidadRecibida: 1, cantidadConfirmada: 0 },
    {
      _id: 'l2',
      descripcion: 'Sello',
      unidad: 'und',
      cantidadSolicitada: 2,
      precioEstimado: 100,
      estadoLinea: 'Recibida',
      cantidadRecibida: 2,
      cantidadConfirmada: 0,
      origenSolicitudRepuestoId: { _id: 'rep2', nombre: 'Sello', ResponsableSolicitud: { _id: 'resp' } },
    },
    { _id: 'l3', descripcion: 'Correa', unidad: 'und', cantidadSolicitada: 1, precioEstimado: 100, estadoLinea: 'Confirmada', cantidadRecibida: 1, cantidadConfirmada: 1 },
  ],
  recepciones: [
    {
      _id: 'rc1',
      fecha: '2026-10-20T10:00:00.000Z',
      recibidaPor: { _id: 'recv', firstName: 'Rita', lastName: 'Recibe' },
      documento: 'REM-77',
      observacion: 'Caja en buen estado',
      evidencias: [{ nombre: 'remision.pdf', url: 'https://files.test/remision.pdf', tipo: 'application/pdf' }],
      items: [
        { lineaId: 'l1', cantidadRecibida: 1, confirmacion: { por: { _id: 'creator', firstName: 'Ana', lastName: 'Ruiz' }, fecha: '2026-10-21T10:00:00.000Z', resultado: 'Recibido', cantidad: 1 } },
        { lineaId: 'l2', cantidadRecibida: 2 },
      ],
    },
  ],
  ...over,
});

const renderPanel = (req: Requisicion) =>
  render(
    <MemoryRouter>
      <RecepcionPanel requisicion={req} />
    </MemoryRouter>
  );

describe('RecepcionPanel', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.userId = 'me';
    mocks.registrar.mockReset().mockResolvedValue({});
    mocks.confirmar.mockReset().mockResolvedValue({});
    mocks.cerrar.mockReset().mockResolvedValue({});
  });

  it('shows ordered / received / confirmed quantities and the state of every line', () => {
    renderPanel(requisicion());
    const first = screen.getAllByText('Rodamiento', { selector: 'td' })[0].closest('tr') as HTMLElement;
    expect(within(first).getAllByRole('cell').map((c) => c.textContent)).toEqual(['Rodamiento', '3', '1', '0', 'Recibida parcial']);
    const third = screen.getByText('Correa', { selector: 'td' }).closest('tr') as HTMLElement;
    expect(within(third).getByText('Confirmada')).toHaveClass('bg-success');
  });

  it('lists the receptions with document, notes, evidence links and confirmations', () => {
    renderPanel(requisicion());
    const item = screen.getByTestId('recepcion-item');
    expect(item).toHaveTextContent('recibida por Rita Recibe');
    expect(item).toHaveTextContent('Documento: REM-77');
    expect(item).toHaveTextContent('Caja en buen estado');
    const link = within(item).getByRole('link', { name: 'remision.pdf' });
    expect(link).toHaveAttribute('href', 'https://files.test/remision.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(within(item).getByText('Recibí')).toBeInTheDocument();
    expect(within(item).getByText('Pendiente de confirmar')).toBeInTheDocument();
  });

  it('renders evidence as a link only for https URLs; javascript:, data:, http: and malformed values are plain text', () => {
    const base = requisicion();
    const evidencias = [
      { nombre: 'ok.pdf', url: 'https://files.test/ok.pdf', tipo: 'application/pdf' },
      { nombre: 'js.pdf', url: 'javascript:alert(1)', tipo: 'application/pdf' },
      { nombre: 'data.pdf', url: 'data:text/html,x', tipo: 'application/pdf' },
      { nombre: 'http.pdf', url: 'http://files.test/http.pdf', tipo: 'application/pdf' },
      { nombre: 'bad.pdf', url: 'not a url', tipo: 'application/pdf' },
    ];
    renderPanel(requisicion({ recepciones: [{ ...base.recepciones![0], evidencias }] }));
    const item = screen.getByTestId('recepcion-item');
    const ok = within(item).getByRole('link', { name: 'ok.pdf' });
    expect(ok).toHaveAttribute('target', '_blank');
    expect(ok).toHaveAttribute('rel', 'noopener noreferrer');
    for (const name of ['js.pdf', 'data.pdf', 'http.pdf', 'bad.pdf']) {
      expect(within(item).getByText(name)).toBeInTheDocument();
      expect(within(item).queryByRole('link', { name })).toBeNull();
    }
  });

  it('shows an empty history message', () => {
    renderPanel(requisicion({ estado: 'Aprobada', recepciones: [] }));
    expect(screen.getByText('Aún no se han registrado recepciones.')).toBeInTheDocument();
  });

  it('offers Registrar recepción only with receive (or manage-all) on a receivable requisicion with pending lines', () => {
    const { unmount } = renderPanel(requisicion());
    expect(screen.queryByRole('button', { name: 'Registrar recepción' })).not.toBeInTheDocument();
    unmount();

    mocks.permissions = new Set(['requisiciones:receive']);
    const second = renderPanel(requisicion());
    expect(screen.getByRole('button', { name: 'Registrar recepción' })).toBeInTheDocument();
    second.unmount();

    const third = renderPanel(requisicion({ estado: 'Cerrada' }));
    expect(screen.queryByRole('button', { name: 'Registrar recepción' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cerrar con faltante/ })).not.toBeInTheDocument();
    third.unmount();

    mocks.permissions = new Set(['requisiciones:manage-all']);
    renderPanel(requisicion());
    expect(screen.getByRole('button', { name: 'Registrar recepción' })).toBeInTheDocument();
  });

  it('shows Confirmar entrega only to the responsible person of a pending item', () => {
    mocks.userId = 'resp';
    const { unmount } = renderPanel(requisicion());
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
    unmount();

    mocks.userId = 'stranger';
    const second = renderPanel(requisicion());
    expect(screen.queryByRole('button', { name: 'Confirmar entrega' })).not.toBeInTheDocument();
    second.unmount();

    // A free line (no linked request) falls back to the requisicion's requester.
    mocks.userId = 'creator';
    const free = requisicion();
    free.lineas[1].origenSolicitudRepuestoId = null;
    renderPanel(free);
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
  });

  it('does not let the person who registered the reception confirm it, except with manage-all', () => {
    mocks.userId = 'recv';
    const req = requisicion();
    req.lineas[1].origenSolicitudRepuestoId = { _id: 'rep2', ResponsableSolicitud: { _id: 'recv' } };
    const { unmount } = renderPanel(req);
    expect(screen.queryByRole('button', { name: 'Confirmar entrega' })).not.toBeInTheDocument();
    expect(screen.getByText(/Registraste esta recepción/)).toBeInTheDocument();
    unmount();

    mocks.permissions = new Set(['requisiciones:manage-all']);
    renderPanel(req);
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
  });

  it('confirms an item as received and sends the registered quantity', async () => {
    mocks.userId = 'resp';
    renderPanel(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByTestId('confirm-item')).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    await waitFor(() =>
      expect(mocks.confirmar).toHaveBeenCalledWith({
        id: 'r1',
        recepcionId: 'rc1',
        data: { items: [{ lineaId: 'l2', resultado: 'Recibido', cantidad: 2 }] },
      })
    );
  });

  it('requires an observation when the item did not arrive or arrived incomplete', async () => {
    mocks.userId = 'resp';
    renderPanel(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByLabelText('No llegó'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    expect(await within(dialog).findByText('La observación es obligatoria')).toBeInTheDocument();
    expect(mocks.confirmar).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText(/Observación/), 'Nunca llegó el paquete');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    await waitFor(() =>
      expect(mocks.confirmar).toHaveBeenCalledWith({
        id: 'r1',
        recepcionId: 'rc1',
        data: { items: [{ lineaId: 'l2', resultado: 'No_Llego', cantidad: 0, observacion: 'Nunca llegó el paquete' }] },
      })
    );
  });

  it('asks how much arrived for an incomplete delivery (less than registered)', async () => {
    mocks.userId = 'resp';
    renderPanel(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByLabelText('Llegó incompleto'));
    const cantidad = within(dialog).getByLabelText('Cantidad que llegó *');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '2');
    await userEvent.type(within(dialog).getByLabelText(/Observación/), 'Faltó una');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    expect(await within(dialog).findByText('Debe ser menor que la cantidad registrada')).toBeInTheDocument();
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    await waitFor(() =>
      expect(mocks.confirmar).toHaveBeenCalledWith({
        id: 'r1',
        recepcionId: 'rc1',
        data: { items: [{ lineaId: 'l2', resultado: 'Incompleto', cantidad: 1, observacion: 'Faltó una' }] },
      })
    );
  });

  it('closes a line with shortfall only with receive, only for open lines, and requires a reason', async () => {
    mocks.permissions = new Set(['requisiciones:receive']);
    renderPanel(requisicion());
    // Confirmed lines can no longer be closed.
    expect(screen.queryByRole('button', { name: 'Cerrar con faltante Correa' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar con faltante Rodamiento' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Cerrar línea' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByRole('textbox'), 'El proveedor no tiene más');
    await userEvent.click(confirm);
    await waitFor(() =>
      expect(mocks.cerrar).toHaveBeenCalledWith({ id: 'r1', lineaId: 'l1', data: { motivo: 'El proveedor no tiene más' } })
    );
  });

  it('shows the Spanish message when the server refuses a confirmation', async () => {
    mocks.userId = 'resp';
    mocks.confirmar.mockRejectedValue({ response: { data: { error: { code: 'SEPARACION_FUNCIONES' } } } });
    renderPanel(requisicion());
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar entrega' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/separación de funciones/);
  });
});

describe('RegistrarRecepcionModal (through the panel)', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['requisiciones:receive']);
    mocks.userId = 'me';
    mocks.registrar.mockReset().mockResolvedValue({});
  });

  const open = async (req = requisicion()) => {
    renderPanel(req);
    await userEvent.click(screen.getByRole('button', { name: 'Registrar recepción' }));
    return screen.findByRole('dialog');
  };

  it('lists only the lines with a pending quantity, with today as the default date', async () => {
    const dialog = await open();
    expect(within(dialog).getByLabelText('Cantidad recibida de Rodamiento')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Cantidad recibida de Sello')).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Cantidad recibida de Correa')).not.toBeInTheDocument();
    const fecha = within(dialog).getByLabelText('Fecha de recepción *') as HTMLInputElement;
    expect(fecha.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('refuses a quantity above what is pending and requires at least one quantity', async () => {
    const dialog = await open();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar recepción' }));
    expect(await within(dialog).findByText('Indica la cantidad recibida de al menos una línea')).toBeInTheDocument();

    const cantidad = within(dialog).getByLabelText('Cantidad recibida de Rodamiento');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '5');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar recepción' }));
    expect(await within(dialog).findByText('No puede superar lo pendiente')).toBeInTheDocument();
    expect(mocks.registrar).not.toHaveBeenCalled();
  });

  it('submits the received lines with document, notes and the evidence files', async () => {
    const dialog = await open();
    const cantidad = within(dialog).getByLabelText('Cantidad recibida de Rodamiento');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '2');
    await userEvent.type(within(dialog).getByLabelText('Remisión o factura'), 'REM-99');
    await userEvent.type(within(dialog).getByLabelText('Observaciones'), 'Llegó en la tarde');
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    await userEvent.upload(document.getElementById('rr-evidencias') as HTMLInputElement, file);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar recepción' }));

    await waitFor(() => expect(mocks.registrar).toHaveBeenCalledTimes(1));
    const arg = mocks.registrar.mock.calls[0][0];
    expect(arg.id).toBe('r1');
    expect(arg.data).toMatchObject({
      documento: 'REM-99',
      observacion: 'Llegó en la tarde',
      items: [{ lineaId: 'l1', cantidadRecibida: 2 }],
    });
    expect(arg.data.evidencias).toEqual([file]);
  });

  it('rejects evidence files of an invalid type or above 5 MB, and more than 5 files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPanel(requisicion());
    await user.click(screen.getByRole('button', { name: 'Registrar recepción' }));
    const dialog = await screen.findByRole('dialog');
    const input = document.getElementById('rr-evidencias') as HTMLInputElement;

    await user.upload(input, new File(['x'], 'datos.exe', { type: 'application/x-msdownload' }));
    expect(await within(dialog).findByText(/«datos.exe» no es una imagen ni un PDF/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Registrar recepción' })).toBeDisabled();

    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
    await user.upload(input, big);
    expect(await within(dialog).findByText(/«grande.pdf» supera 5 MB/)).toBeInTheDocument();

    const many = Array.from({ length: 6 }, (_, i) => new File(['x'], `f${i}.png`, { type: 'image/png' }));
    await user.upload(input, many);
    expect(await within(dialog).findByText('Puedes adjuntar hasta 5 archivos.')).toBeInTheDocument();

    await user.upload(input, new File(['x'], 'ok.png', { type: 'image/png' }));
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Registrar recepción' })).toBeEnabled());
  });

  it('shows the server answer CANTIDAD_EXCEDE in Spanish', async () => {
    mocks.registrar.mockRejectedValue({ response: { data: { error: { code: 'CANTIDAD_EXCEDE' } } } });
    const dialog = await open();
    const cantidad = within(dialog).getByLabelText('Cantidad recibida de Rodamiento');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Registrar recepción' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('La cantidad recibida supera lo solicitado');
  });
});
