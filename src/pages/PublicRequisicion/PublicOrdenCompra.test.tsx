import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicOrdenCompra as OrdenData, PublicRequisicion } from '@/services/publicRequisicion.service';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  pdf: vi.fn(),
  subir: vi.fn(),
  save: vi.fn(),
}));

vi.mock('@/services/publicRequisicion.service', () => ({
  publicRequisicionService: {
    get: mocks.get,
    responderInvitacion: vi.fn(),
    enviarCotizacion: vi.fn(),
    descargarOrdenCompraPdf: mocks.pdf,
    subirEntregables: mocks.subir,
  },
}));
vi.mock('@/utils/saveBlob', () => ({ saveBlob: mocks.save }));

import PublicRequisicionPage from './PublicRequisicionPage';

const orden = (over: Partial<OrdenData> = {}): OrdenData => ({
  numero: 'OC-2026-0007',
  version: 2,
  lineas: [{ descripcion: 'Rodamiento 6204', cantidad: 4, precioUnitario: 300, subtotal: 1200 }],
  total: 1200,
  moneda: 'COP',
  condiciones: 'Pago a 30 días',
  fechaEntrega: '2026-12-15T00:00:00.000Z',
  requiereEntregables: true,
  entrega: { estado: 'Pendiente', archivos: [] },
  ...over,
});

const portal = (over: Partial<PublicRequisicion> = {}): PublicRequisicion => ({
  tenantNombre: 'Planta Norte',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra de rodamientos',
  instrucciones: null,
  fechaLimiteCotizacion: '2026-12-20T15:00:00.000Z',
  items: [{ descripcion: 'Rodamiento 6204', cantidad: 4, unidad: 'und' }],
  estadoEnvio: 'Ganador',
  cotizacion: null,
  cerrada: false,
  ordenCompra: orden(),
  ...over,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/public/requisicion/abc123']}>
        <Routes>
          <Route path="/public/requisicion/:token" element={<PublicRequisicionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('Public portal: purchase order of the winner', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: portal() });
    mocks.pdf.mockReset().mockResolvedValue(new Blob(['pdf']));
    mocks.subir.mockReset().mockResolvedValue({ data: portal() });
    mocks.save.mockReset();
  });

  it('shows the order with prices, total, conditions and version', async () => {
    renderPage();
    expect(await screen.findByText(/OC-2026-0007/)).toBeInTheDocument();
    expect(screen.getByText(/versión 2/)).toBeInTheDocument();
    expect(screen.getByText('Rodamiento 6204')).toBeInTheDocument();
    expect(screen.getByText('Pago a 30 días')).toBeInTheDocument();
    expect(screen.getAllByText(/1\.200/).length).toBeGreaterThan(0);
  });

  it('falls back to the congratulations message when the order is not available yet', async () => {
    mocks.get.mockResolvedValue({ data: portal({ ordenCompra: null }) });
    renderPage();
    expect(await screen.findByText(/Tu propuesta fue seleccionada/)).toBeInTheDocument();
    expect(screen.queryByTestId('public-orden-compra')).not.toBeInTheDocument();
  });

  it('never shows the order to a discarded supplier', async () => {
    mocks.get.mockResolvedValue({ data: portal({ estadoEnvio: 'Descartado', ordenCompra: null }) });
    renderPage();
    expect(await screen.findByText(/se eligió otra propuesta/)).toBeInTheDocument();
    expect(screen.queryByTestId('public-orden-compra')).not.toBeInTheDocument();
  });

  it('downloads the PDF through the token service', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Descargar PDF' }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith(expect.any(Blob), 'OC-2026-0007.pdf'));
  });

  it('shows a Spanish message when the PDF is unavailable', async () => {
    mocks.pdf.mockRejectedValue({ response: { status: 502, data: { error: { code: 'PDF_NO_DISPONIBLE' } } } });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Descargar PDF' }));
    expect(await screen.findByText(/PDF de la orden de compra no está disponible/)).toBeInTheDocument();
  });

  it('uploads supports and confirms', async () => {
    const user = userEvent.setup();
    renderPage();
    const input = await screen.findByLabelText(/Subir soportes/);
    const file = new File(['%PDF'], 'acta.pdf', { type: 'application/pdf' });
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar soportes' }));
    await waitFor(() => expect(mocks.subir).toHaveBeenCalledWith('abc123', [file]));
    expect(await screen.findByText('Recibimos tus soportes. Gracias.')).toBeInTheDocument();
  });

  it('shows the last return observation and invites to re-deliver', async () => {
    mocks.get.mockResolvedValue({
      data: portal({ ordenCompra: orden({ entrega: { estado: 'Devolucion', archivos: [], ultimaObservacion: 'Falta el acta firmada' } }) }),
    });
    renderPage();
    expect(await screen.findByTestId('public-oc-observacion')).toHaveTextContent('Falta el acta firmada');
    expect(screen.getByLabelText(/Volver a enviar tus soportes/)).toBeInTheDocument();
  });

  it('offers no upload while under review, nor a deliverables section when they are not required', async () => {
    mocks.get.mockResolvedValue({ data: portal({ ordenCompra: orden({ entrega: { estado: 'En_Revision', archivos: [] } }) }) });
    const { unmount } = renderPage();
    expect(await screen.findByText('Estamos revisando tus soportes.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar soportes' })).not.toBeInTheDocument();
    unmount();

    mocks.get.mockResolvedValue({ data: portal({ ordenCompra: orden({ requiereEntregables: false, entrega: null }) }) });
    renderPage();
    expect(await screen.findByText(/OC-2026-0007/)).toBeInTheDocument();
    expect(screen.queryByText('Entregables')).not.toBeInTheDocument();
  });

  it('only links https files (others are shown as plain names)', async () => {
    mocks.get.mockResolvedValue({
      data: portal({
        ordenCompra: orden({
          entrega: {
            estado: 'Recibidos',
            archivos: [
              { url: 'https://files.example/ok.pdf', nombre: 'ok.pdf', subidoPor: 'proveedor', fecha: '2026-11-03T10:00:00.000Z' },
              { url: 'javascript:alert(1)', nombre: 'js.pdf', subidoPor: 'proveedor', fecha: '2026-11-03T10:00:00.000Z' },
              { url: 'http://files.example/plain.pdf', nombre: 'plain.pdf', subidoPor: 'proveedor', fecha: '2026-11-03T10:00:00.000Z' },
            ],
          },
        }),
      }),
    });
    renderPage();
    expect(await screen.findByRole('link', { name: 'ok.pdf' })).toHaveAttribute('href', 'https://files.example/ok.pdf');
    expect(screen.queryByRole('link', { name: 'js.pdf' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'plain.pdf' })).not.toBeInTheDocument();
    expect(screen.getByText('js.pdf')).toBeInTheDocument();
  });

  it('maps INVALID_FILE_TYPE from the server to a specific message', async () => {
    mocks.subir.mockRejectedValue({ response: { status: 400, data: { error: { code: 'INVALID_FILE_TYPE' } } } });
    const user = userEvent.setup();
    renderPage();
    await user.upload(await screen.findByLabelText(/Subir soportes/), new File(['%PDF'], 'a.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Enviar soportes' }));
    expect(await screen.findByText('Solo se admiten PDF o imágenes (JPG, PNG, WEBP).')).toBeInTheDocument();
  });

  it('blocks an invalid file on the client', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();
    await user.upload(await screen.findByLabelText(/Subir soportes/), new File(['x'], 'virus.exe', { type: 'application/x-msdownload' }));
    expect(screen.getByText('Solo se admiten PDF o imágenes (JPG, PNG, WEBP).')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar soportes' })).toBeDisabled();
  });
});
