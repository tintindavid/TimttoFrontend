import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  navigate: vi.fn(),
  permissions: new Set<string>(['requisiciones:send']),
  user: { _id: 'u1', areaId: 'a2' } as { _id: string; areaId?: string },
  onHide: vi.fn(),
  onCreated: vi.fn(),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: () => false,
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({
    data: {
      data: [
        { _id: 'a1', nombre: 'Operaciones', activa: true },
        { _id: 'a2', nombre: 'Mantenimiento', activa: true },
        { _id: 'a3', nombre: 'Cerrada', activa: false },
      ],
    },
  }),
}));
vi.mock('@/hooks/useRepuestos', () => ({
  useCreateRequisicionFromSolicitudes: () => ({ mutateAsync: mocks.create, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
import { toast } from 'react-toastify';

import HacerRequisicionModal, { highestPrioridad, parseCantidad } from './HacerRequisicionModal';

const solicitudes = [
  { _id: 'r1', nombre: 'Filtro', Cantidad: '2', PrecioRepuesto: 50, Prioridad: 'Alta' },
  { _id: 'r2', nombre: 'Bomba', Cantidad: 'dos', Prioridad: 'Critica' },
];

const renderModal = (items = solicitudes) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <HacerRequisicionModal show onHide={mocks.onHide} solicitudes={items} onCreated={mocks.onCreated} />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('HacerRequisicionModal', () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.create.mockResolvedValue({ data: { requisicion: { _id: 'new1' } } });
    mocks.navigate.mockReset();
    mocks.onHide.mockReset();
    mocks.onCreated.mockReset();
    mocks.permissions = new Set(['requisiciones:send']);
    mocks.user = { _id: 'u1', areaId: 'a2' };
    vi.mocked(toast.warning).mockClear();
  });

  it('prefills title, read-only type and area, the highest priority and the editable lines', () => {
    renderModal();
    expect(screen.getByLabelText('Título *')).toHaveValue('Requisición de 2 repuestos');
    expect(screen.getByDisplayValue('Repuestos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mantenimiento')).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('Repuestos')).toHaveAttribute('readonly');
    expect(screen.queryByRole('combobox', { name: /Área/ })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Prioridad/ })).toHaveValue('Urgente');
    expect(screen.getByLabelText('Cantidad de Filtro')).toHaveValue(2);
    expect(screen.getByLabelText('Descripción de Filtro')).toHaveValue('Filtro');
    // Reference price is read-only; there is no price input nor estimated total.
    expect(screen.queryByLabelText(/Precio estimado/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('hr-total')).not.toBeInTheDocument();
    expect(screen.getByTestId('hr-precio-0')).toHaveTextContent('50');
    expect(screen.getByTestId('hr-precio-1')).toHaveTextContent('Sin estimar');
    expect(screen.getByText(/El valor real lo definen las cotizaciones/)).toBeInTheDocument();
    // A non-numeric quantity defaults to 1 and the user is warned.
    expect(screen.getByLabelText('Cantidad de Bomba')).toHaveValue(1);
    expect(screen.getByText(/«Bomba» no es un número/)).toBeInTheDocument();
  });

  it('uses the request name in the title for a single request', () => {
    renderModal([solicitudes[0]]);
    expect(screen.getByLabelText('Título *')).toHaveValue('Requisición: Filtro');
  });

  it('creates a draft with the edited lines and navigates to the new requisicion', async () => {
    renderModal();
    const cantidad = screen.getByLabelText('Cantidad de Filtro');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    // Exact payload: no tipoRequisicionId, areaId or precioEstimado.
    expect(mocks.create.mock.calls[0][0]).toEqual({
      repuestoIds: ['r1', 'r2'],
      titulo: 'Requisición de 2 repuestos',
      prioridad: 'Urgente',
      enviar: false,
      lineas: [
        { repuestoId: 'r1', cantidad: 3, descripcion: 'Filtro' },
        { repuestoId: 'r2', cantidad: 1, descripcion: 'Bomba' },
      ],
    });
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/requisiciones/new1'));
    expect(mocks.onCreated).toHaveBeenCalled();
    expect(mocks.onHide).toHaveBeenCalled();
  });

  it('requires the justification to create and send, then sends', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Crear y enviar a aprobación' }));
    expect(await screen.findByText('La justificación es obligatoria para enviar')).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('textbox', { name: /Justificación/ }), 'Se necesita para la OT');
    await userEvent.click(screen.getByRole('button', { name: 'Crear y enviar a aprobación' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ enviar: true, justificacion: 'Se necesita para la OT' });
  });

  it('hides the send button without the send permission', () => {
    mocks.permissions = new Set();
    renderModal();
    expect(screen.queryByRole('button', { name: 'Crear y enviar a aprobación' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear borrador' })).toBeInTheDocument();
  });

  it('validates the lines inline (quantity and description)', async () => {
    renderModal([solicitudes[0]]);
    const cantidad = screen.getByLabelText('Cantidad de Filtro');
    await userEvent.clear(cantidad);
    await userEvent.type(cantidad, '0');
    await userEvent.clear(screen.getByLabelText('Descripción de Filtro'));
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    expect(await screen.findByText('La cantidad debe ser mayor que cero')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('shows the server warnings as toasts', async () => {
    mocks.create.mockResolvedValue({ data: { requisicion: { _id: 'new1' }, advertencias: [{ repuestoId: 'r1', campo: 'cantidad', valorOriginal: '2 und', mensaje: 'Cantidad de «Bomba» ajustada a 1' }] } });
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Cantidad de «Bomba» ajustada a 1', expect.anything()));
  });

  it('shows the Spanish message of SOLICITUD_YA_VINCULADA and stays open', async () => {
    mocks.create.mockRejectedValue({ response: { data: { error: { code: 'SOLICITUD_YA_VINCULADA' } } } });
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Crear borrador' }));
    expect(await screen.findByText('Alguna de las solicitudes ya pertenece a otra requisición.')).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.onHide).not.toHaveBeenCalled();
  });
});

describe('highestPrioridad / parseCantidad', () => {
  it('maps Critica to Urgente, picks the highest and defaults to Media', () => {
    expect(highestPrioridad([{ Prioridad: 'Baja' }, { Prioridad: 'Alta' }])).toBe('Alta');
    expect(highestPrioridad([{ Prioridad: 'Critica' }])).toBe('Urgente');
    expect(highestPrioridad([{}, { Prioridad: 'Rara' }])).toBe('Media');
  });
  it('reads numeric text and falls back to 1', () => {
    expect(parseCantidad('2,5')).toBe(2.5);
    expect(parseCantidad(4)).toBe(4);
    expect(parseCantidad('x')).toBe(1);
    expect(parseCantidad('0')).toBe(1);
    expect(parseCantidad(undefined)).toBe(1);
  });
});
