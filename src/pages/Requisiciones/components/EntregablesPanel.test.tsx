import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OrdenCompra, OrdenCompraEntrega } from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  subir: vi.fn(),
  marcar: vi.fn(),
  revisar: vi.fn(),
  aceptar: vi.fn(),
  devolver: vi.fn(),
  toastError: vi.fn(),
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
  useSubirEntregables: () => ({ mutateAsync: mocks.subir, isLoading: false }),
  useMarcarEntregablesRecibidos: () => ({ mutateAsync: mocks.marcar, isLoading: false }),
  useRevisarEntregables: () => ({ mutateAsync: mocks.revisar, isLoading: false }),
  useAceptarEntregables: () => ({ mutateAsync: mocks.aceptar, isLoading: false }),
  useDevolverEntregables: () => ({ mutateAsync: mocks.devolver, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: mocks.toastError, warning: vi.fn() } }));

import EntregablesPanel from './EntregablesPanel';

const req = (entrega: OrdenCompraEntrega, estado: Requisicion['estado'] = 'OC_Enviada'): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Alta',
  estado,
  creadaPor: 'creator',
  montoEstimado: 1000,
  version: 1,
  lineas: [],
  ordenCompra: {
    numero: 'OC-2026-0001',
    version: 1,
    estado: 'Enviada',
    lineas: [],
    total: 1000,
    requiereEntregables: true,
    entrega,
  } as OrdenCompra,
});

const archivo = { url: 'https://files.example/a.pdf', nombre: 'planos.pdf', subidoPor: 'proveedor' as const, fecha: '2026-11-03T10:00:00.000Z' };

describe('EntregablesPanel', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['requisiciones:manage-deliverables']);
    [mocks.subir, mocks.marcar, mocks.revisar, mocks.aceptar, mocks.devolver].forEach((fn) => fn.mockReset().mockResolvedValue({}));
  });

  it('shows the state, who uploaded each file and when', () => {
    render(<EntregablesPanel requisicion={req({ estado: 'Recibidos', archivos: [archivo, { ...archivo, nombre: 'acta.pdf', subidoPor: 'usuario' }] })} />);
    expect(screen.getByText('Recibidos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'planos.pdf' })).toHaveAttribute('href', 'https://files.example/a.pdf');
    expect(screen.getByText('Proveedor')).toBeInTheDocument();
    expect(screen.getByText('Usuario interno')).toBeInTheDocument();
  });

  it('does not link an unsafe URL', () => {
    render(<EntregablesPanel requisicion={req({ estado: 'Recibidos', archivos: [{ ...archivo, url: 'javascript:alert(1)' }] })} />);
    expect(screen.queryByRole('link', { name: 'planos.pdf' })).not.toBeInTheDocument();
    expect(screen.getByText('planos.pdf')).toBeInTheDocument();
  });

  it('only links https URLs (http, ftp and data are shown as plain names)', () => {
    const urls = ['http://files.example/a.pdf', 'ftp://files.example/a.pdf', 'data:text/html,x', 'https://user:pw@files.example/a.pdf'];
    render(<EntregablesPanel requisicion={req({ estado: 'Recibidos', archivos: urls.map((url, i) => ({ ...archivo, url, nombre: `f${i}.pdf` })) })} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    urls.forEach((_, i) => expect(screen.getByText(`f${i}.pdf`)).toBeInTheDocument());
  });

  it('accepts only PDF, JPG, PNG and WebP in the picker and rejects Office files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<EntregablesPanel requisicion={req({ estado: 'Pendiente' })} />);
    const input = screen.getByLabelText(/Adjuntar en nombre del proveedor/) as HTMLInputElement;
    expect(input.accept).toBe('.pdf,image/jpeg,image/png,image/webp');
    await user.upload(input, new File(['x'], 'remision.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    expect(screen.getByText('Solo se admiten PDF o imágenes (JPG, PNG, WEBP).')).toBeInTheDocument();
  });

  it('shows the specific Spanish message when the server rejects the file type', async () => {
    mocks.subir.mockRejectedValue({ response: { data: { error: { code: 'INVALID_FILE_TYPE' } } } });
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'Pendiente' })} />);
    await user.upload(screen.getByLabelText(/Adjuntar en nombre del proveedor/), new File(['%PDF'], 'a.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Adjuntar' }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Solo se admiten PDF o imágenes (JPG, PNG, WEBP).'));
  });

  it('shows the empty state', () => {
    render(<EntregablesPanel requisicion={req({ estado: 'Pendiente' })} />);
    expect(screen.getByText('El proveedor aún no ha entregado soportes.')).toBeInTheDocument();
  });

  it('shows no actions without requisiciones:manage-deliverables', () => {
    mocks.permissions = new Set();
    render(<EntregablesPanel requisicion={req({ estado: 'En_Revision', archivos: [archivo] })} />);
    ['Marcar como recibidos', 'Iniciar revisión', 'Aceptar entregables', 'Devolver al proveedor', 'Adjuntar'].forEach((name) =>
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    );
  });

  it('marks as received from Pendiente', async () => {
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'Pendiente' })} />);
    await user.click(screen.getByRole('button', { name: 'Marcar como recibidos' }));
    await waitFor(() => expect(mocks.marcar).toHaveBeenCalledWith('r1'));
  });

  it('starts the review from Recibidos', async () => {
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'Recibidos', archivos: [archivo] })} />);
    expect(screen.queryByRole('button', { name: 'Aceptar entregables' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Iniciar revisión' }));
    await waitFor(() => expect(mocks.revisar).toHaveBeenCalledWith('r1'));
  });

  it('accepts from En_Revision', async () => {
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'En_Revision', archivos: [archivo] })} />);
    await user.click(screen.getByRole('button', { name: 'Aceptar entregables' }));
    await waitFor(() => expect(mocks.aceptar).toHaveBeenCalledWith('r1'));
  });

  it('requires an observation to return the deliverables', async () => {
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'En_Revision', archivos: [archivo] })} />);
    await user.click(screen.getByRole('button', { name: 'Devolver al proveedor' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Devolver') as HTMLButtonElement;
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole('textbox'), 'Falta el acta firmada');
    await user.click(confirm);
    await waitFor(() => expect(mocks.devolver).toHaveBeenCalledWith({ id: 'r1', data: { observacion: 'Falta el acta firmada' } }));
  });

  it('shows the last return observation and lets a re-delivery be attached', async () => {
    const user = userEvent.setup();
    render(<EntregablesPanel requisicion={req({ estado: 'Devolucion', archivos: [archivo], ultimaObservacion: 'Falta el acta firmada' })} />);
    expect(screen.getByTestId('entregables-observacion')).toHaveTextContent('Falta el acta firmada');
    const input = screen.getByLabelText(/Adjuntar en nombre del proveedor/) as HTMLInputElement;
    const file = new File(['%PDF'], 'acta.pdf', { type: 'application/pdf' });
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Adjuntar' }));
    await waitFor(() => expect(mocks.subir).toHaveBeenCalledWith({ id: 'r1', archivos: [file] }));
  });

  it('blocks an invalid file type on the client', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<EntregablesPanel requisicion={req({ estado: 'Pendiente' })} />);
    await user.upload(screen.getByLabelText(/Adjuntar en nombre del proveedor/), new File(['x'], 'virus.exe', { type: 'application/x-msdownload' }));
    expect(screen.getByText('Solo se admiten PDF o imágenes (JPG, PNG, WEBP).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adjuntar' })).toBeDisabled();
  });

  it('cannot attach once accepted or while in review', () => {
    const { unmount } = render(<EntregablesPanel requisicion={req({ estado: 'Aceptados', archivos: [archivo] })} />);
    expect(screen.queryByRole('button', { name: 'Adjuntar' })).not.toBeInTheDocument();
    expect(screen.getByText('Los entregables fueron aceptados.')).toBeInTheDocument();
    unmount();
    render(<EntregablesPanel requisicion={req({ estado: 'En_Revision', archivos: [archivo] })} />);
    expect(screen.queryByRole('button', { name: 'Adjuntar' })).not.toBeInTheDocument();
  });
});
