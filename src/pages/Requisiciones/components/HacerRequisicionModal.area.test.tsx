import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  user: { _id: 'u1' } as { _id: string; areaId?: string },
  areas: undefined as undefined | { data: Array<{ _id: string; nombre: string; activa: boolean }> },
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({ has: () => true, hasAny: () => false, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useAreas', () => ({ useGetAreas: () => ({ data: mocks.areas }) }));
vi.mock('@/hooks/useRepuestos', () => ({
  useCreateRequisicionFromSolicitudes: () => ({ mutateAsync: mocks.create, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import HacerRequisicionModal from './HacerRequisicionModal';

const solicitudes = [{ _id: 'r1', nombre: 'Filtro', Cantidad: '2', PrecioRepuesto: 50, Prioridad: 'Alta' }];

const renderModal = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <HacerRequisicionModal show onHide={vi.fn()} solicitudes={solicitudes} />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('HacerRequisicionModal without own active area', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.create.mockResolvedValue({ data: { requisicion: { _id: 'new1' } } });
    mocks.user = { _id: 'u1' };
    mocks.areas = {
      data: [
        { _id: 'a1', nombre: 'Operaciones', activa: true },
        { _id: 'a3', nombre: 'Cerrada', activa: false },
      ],
    };
  });

  it('requires an area from the active ones and sends its id', async () => {
    renderModal();
    const select = screen.getByRole('combobox', { name: /Área \*/ });
    expect(screen.queryByRole('option', { name: 'Cerrada' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    expect(await screen.findByText('Selecciona un área', { selector: '.invalid-feedback' })).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await userEvent.selectOptions(select, 'a1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const payload = mocks.create.mock.calls[0][0];
    expect(payload.areaId).toBe('a1');
    expect(payload).not.toHaveProperty('tipoRequisicionId');
    expect(payload.lineas[0]).not.toHaveProperty('precioEstimado');
  });

  it.each([
    ['areas still loading or failed', undefined],
    ['own area not among the loaded areas', { data: [{ _id: 'a1', nombre: 'Operaciones', activa: true }] }],
  ])('does not show the selector nor block submit with an own area (%s)', async (_label, areas) => {
    mocks.user = { _id: 'u1', areaId: 'zz' };
    mocks.areas = areas;
    renderModal();
    expect(screen.queryByRole('combobox', { name: /Área/ })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Tu área asignada')).toHaveAttribute('readonly');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('areaId');
  });

  it('shows the selector after AREA_REQUERIDA, keeps typed values and sends the chosen area', async () => {
    mocks.user = { _id: 'u1', areaId: 'zz' };
    mocks.create.mockRejectedValueOnce({ response: { data: { error: { code: 'AREA_REQUERIDA' } } } });
    renderModal();
    await userEvent.type(screen.getByRole('textbox', { name: /Justificación/ }), 'Motivo');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    const select = await screen.findByRole('combobox', { name: /Área \*/ });
    expect(screen.getByRole('textbox', { name: /Justificación/ })).toHaveValue('Motivo');
    await userEvent.selectOptions(select, 'a1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
    expect(mocks.create.mock.calls[1][0].areaId).toBe('a1');
  });

  it('explains SIN_REGLAS_APROBACION, stays open and keeps the draft path available', async () => {
    mocks.user = { _id: 'u1', areaId: 'a1' };
    mocks.create.mockRejectedValueOnce({ response: { data: { error: { code: 'SIN_REGLAS_APROBACION' } } } });
    renderModal();
    await userEvent.type(screen.getByRole('textbox', { name: /Justificación/ }), 'Motivo');
    await userEvent.click(screen.getByRole('button', { name: 'Crear y enviar a aprobación' }));
    expect(await screen.findByText(/sin precio estimado\. Guárdala como borrador/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Justificación/ })).toHaveValue('Motivo');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
    expect(mocks.create.mock.calls[1][0].enviar).toBe(false);
  });

  it.each([
    ['TIPO_REPUESTO_NO_CONFIGURADO', /aún no tiene el tipo de requisición «Repuestos»/],
    ['AREA_REQUERIDA', /no tiene un área asignada/],
  ])('shows the Spanish message of %s', async (code, text) => {
    mocks.user = { _id: 'u1', areaId: 'a1' };
    mocks.create.mockRejectedValue({ response: { data: { error: { code } } } });
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    expect(await screen.findByText(text)).toBeInTheDocument();
  });
});
