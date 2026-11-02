import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicRequisicion } from '@/services/publicRequisicion.service';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  responder: vi.fn(),
  enviar: vi.fn(),
}));

vi.mock('@/services/publicRequisicion.service', () => ({
  publicRequisicionService: {
    get: mocks.get,
    responderInvitacion: mocks.responder,
    enviarCotizacion: mocks.enviar,
  },
}));

import PublicRequisicionPage from './PublicRequisicionPage';

const portal = (over: Partial<PublicRequisicion> = {}): PublicRequisicion => ({
  tenantNombre: 'Planta Norte',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra de rodamientos',
  instrucciones: 'Cotizar puesto en planta',
  fechaLimiteCotizacion: '2026-12-20T15:00:00.000Z',
  items: [{ descripcion: 'Rodamiento 6204', cantidad: 4, unidad: 'und', especificacion: 'SKF' }],
  estadoEnvio: 'Enviado',
  cotizacion: null,
  cerrada: false,
  ...over,
});

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/public/requisicion/abc123']}>
        <Routes>
          <Route path="/public/requisicion/:token" element={<PublicRequisicionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const apiError = (status: number, code?: string) => ({ response: { status, data: { error: { code } } } });

describe('PublicRequisicionPage', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.responder.mockReset().mockResolvedValue({ data: {} });
    mocks.enviar.mockReset().mockResolvedValue({ data: {} });
  });

  it('loads by token and shows the items with accept / decline actions', async () => {
    mocks.get.mockResolvedValue({ data: portal() });
    renderPage();
    expect(await screen.findByText(/REQ-2026-0042/)).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith('abc123');
    expect(screen.getByText('Rodamiento 6204')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar participar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No participar' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('accepting the invitation sends aceptar=true', async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ data: portal() });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Aceptar participar' }));
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith('abc123', true));
  });

  it('shows the quotation form after accepting and blocks an empty submission', async () => {
    mocks.get.mockResolvedValue({ data: portal({ estadoEnvio: 'Aceptado' }) });
    renderPage();
    const submit = await screen.findByRole('button', { name: 'Enviar cotización' });
    expect(submit).toBeDisabled();
  });

  it('rejects a non-https link and sends a note-only quotation', async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ data: portal({ estadoEnvio: 'Aceptado' }) });
    renderPage();
    await user.type(await screen.findByLabelText('Enlace a la propuesta'), 'http://inseguro.test');
    expect(screen.getByText('El enlace debe comenzar con https://')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Enlace a la propuesta'));
    await user.type(screen.getByLabelText('Observación'), 'Entrega en 5 días');
    await user.click(screen.getByRole('button', { name: 'Enviar cotización' }));
    await waitFor(() =>
      expect(mocks.enviar).toHaveBeenCalledWith('abc123', expect.objectContaining({ observacion: 'Entrega en 5 días', archivo: null }))
    );
  });

  it('shows only a courtesy message when the invitation is closed (no consecutivo, no items)', async () => {
    mocks.get.mockResolvedValue({ data: portal({ cerrada: true }) });
    renderPage();
    expect(await screen.findByText(/plazo para cotizar ya terminó/i)).toBeInTheDocument();
    expect(screen.queryByText(/REQ-2026-0042/)).not.toBeInTheDocument();
    expect(screen.queryByText('Rodamiento 6204')).not.toBeInTheDocument();
  });

  it.each([
    [apiError(403, 'TOKEN_EXPIRADO'), /ya no está disponible/i],
    [apiError(403, 'FECHA_LIMITE_VENCIDA'), /plazo para cotizar ya terminó/i],
    [apiError(404), /enlace no es válido/i],
    [apiError(429), /demasiados intentos/i],
  ])('maps a load error to a short courtesy message', async (error, message) => {
    mocks.get.mockRejectedValue(error);
    renderPage();
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText(/REQ-/)).not.toBeInTheDocument();
  });

  it('never logs the token', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    mocks.get.mockResolvedValue({ data: portal() });
    renderPage();
    await screen.findByText(/REQ-2026-0042/);
    spies.forEach((spy) => {
      spy.mock.calls.forEach((args) => expect(JSON.stringify(args)).not.toContain('abc123'));
      spy.mockRestore();
    });
  });
});
