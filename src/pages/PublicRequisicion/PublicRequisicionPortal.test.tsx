import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicRequisicion } from '@/services/publicRequisicion.service';

const mocks = vi.hoisted(() => ({ get: vi.fn(), responder: vi.fn(), enviar: vi.fn() }));

vi.mock('@/services/publicRequisicion.service', () => ({
  publicRequisicionService: { get: mocks.get, responderInvitacion: mocks.responder, enviarCotizacion: mocks.enviar },
}));

import PublicRequisicionPage from './PublicRequisicionPage';

const portal = (over: Partial<PublicRequisicion> = {}): PublicRequisicion => ({
  tenantNombre: 'Planta Norte',
  consecutivo: 'REQ-2026-0042',
  titulo: 'Compra de rodamientos',
  instrucciones: null,
  fechaLimiteCotizacion: '2026-12-20T15:00:00.000Z',
  items: [{ descripcion: 'Rodamiento 6204', cantidad: 4, unidad: 'und' }],
  estadoEnvio: 'Enviado',
  cotizacion: null,
  cerrada: false,
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

describe('PublicRequisicionPage (round 2)', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.responder.mockReset().mockResolvedValue({ data: {} });
    mocks.enviar.mockReset();
  });

  it('shows the instructions under a heading when present and never the internal description', async () => {
    mocks.get.mockResolvedValue({ data: portal({ instrucciones: 'Cotizar puesto en planta' }) });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Instrucciones para los proveedores' })).toBeInTheDocument();
    expect(screen.getByText('Cotizar puesto en planta')).toBeInTheDocument();
  });

  it('omits the instructions block when there are none', async () => {
    mocks.get.mockResolvedValue({ data: portal() });
    renderPage();
    await screen.findByText(/REQ-2026-0042/);
    expect(screen.queryByText('Instrucciones para los proveedores')).not.toBeInTheDocument();
  });

  it('asks for confirmation before declining and then keeps the thank-you even though the link expires', async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValueOnce({ data: portal() }).mockRejectedValue({ response: { status: 403, data: { error: { code: 'TOKEN_EXPIRADO' } } } });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'No participar' }));
    expect(mocks.responder).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sí, no participar' }));
    await waitFor(() => expect(mocks.responder).toHaveBeenCalledWith('abc123', false));
    expect(await screen.findByText(/Registramos que no participarás/)).toBeInTheDocument();
    expect(screen.queryByText(/ya no está disponible/)).not.toBeInTheDocument();
  });

  it('tells the winner about the award instead of the closed-window text', async () => {
    mocks.get.mockResolvedValue({ data: portal({ estadoEnvio: 'Ganador', cerrada: true }) });
    renderPage();
    expect(await screen.findByText(/propuesta fue seleccionada/)).toBeInTheDocument();
    expect(screen.queryByText(/plazo para cotizar/)).not.toBeInTheDocument();
  });

  it('shows a specific message for a rejected fake file', async () => {
    const user = userEvent.setup();
    mocks.get.mockResolvedValue({ data: portal({ estadoEnvio: 'Aceptado' }) });
    mocks.enviar.mockRejectedValue({ response: { status: 400, data: { error: { code: 'FILE_CONTENT_MISMATCH' } } } });
    renderPage();
    await user.type(await screen.findByLabelText('Observación'), 'Oferta');
    await user.click(screen.getByRole('button', { name: 'Enviar cotización' }));
    expect(await screen.findByText(/contenido del archivo no corresponde/)).toBeInTheDocument();
  });
});
