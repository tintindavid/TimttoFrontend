import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  enviar: vi.fn(),
  detail: { data: undefined as unknown, isLoading: false, isError: false },
  canStock: false,
  navigate: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'u1', email: 'a@b.co', role: 'user' } }) }));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: () => mocks.canStock }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({
    isLoading: false,
    data: { data: [{ _id: 'a1', nombre: 'Mantenimiento', codigo: 'MTO', jefesIds: [], activa: true }] },
  }),
}));
vi.mock('@/hooks/useTiposRequisicion', () => ({
  useGetTiposRequisicion: () => ({
    isLoading: false,
    data: { data: [{ _id: 't1', nombre: 'Repuestos', codigo: 'REP', activo: true }] },
  }),
}));
vi.mock('@/hooks/useInventarioRepuestos', () => ({
  useInventarioList: () => ({ data: { data: [] }, isFetching: false }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({
  useGetRequisicion: () => mocks.detail,
  useCreateRequisicion: () => ({ mutateAsync: mocks.create, isLoading: false }),
  useUpdateRequisicion: () => ({ mutateAsync: mocks.update, isLoading: false }),
  useEnviarRequisicion: () => ({ mutateAsync: mocks.enviar, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import RequisicionFormPage from './RequisicionFormPage';

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/requisiciones/new']}>
      <Routes>
        <Route path="/requisiciones/new" element={<RequisicionFormPage />} />
      </Routes>
    </MemoryRouter>
  );

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Título *'), 'Rodamientos para bomba');
  await user.selectOptions(screen.getByLabelText('Tipo *'), 't1');
  await user.selectOptions(screen.getByLabelText('Área *'), 'a1');
  await user.type(screen.getByLabelText('Descripción *'), 'Rodamiento 6204');
  const qty = screen.getByLabelText('Cantidad *');
  await user.clear(qty);
  await user.type(qty, '3');
  const price = screen.getByLabelText('Precio estimado (unitario) *');
  await user.clear(price);
  await user.type(price, '1000');
};

describe('RequisicionFormPage', () => {
  beforeEach(() => {
    mocks.create.mockReset().mockResolvedValue({ data: { _id: 'new1' } });
    mocks.update.mockReset().mockResolvedValue({ data: { _id: 'r1' } });
    mocks.enviar.mockReset().mockResolvedValue({ data: { _id: 'new1' } });
    mocks.navigate.mockReset();
    mocks.canStock = false;
    mocks.detail = { data: undefined, isLoading: false, isError: false };
  });

  it('shows validation errors and does not call the API when required fields are empty', async () => {
    const user = userEvent.setup();
    renderCreate();
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un tipo')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('updates the live total as lines change', async () => {
    const user = userEvent.setup();
    renderCreate();
    await fillValid(user);
    expect(screen.getByTestId('monto-total').textContent).toMatch(/3\.000/);
    await user.click(screen.getByRole('button', { name: /Agregar línea/ }));
    expect(screen.getAllByTestId('linea-row')).toHaveLength(2);
  });

  it('saves a draft without justification and goes to the detail', async () => {
    const user = userEvent.setup();
    renderCreate();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const payload = mocks.create.mock.calls[0][0];
    expect(payload).toMatchObject({
      titulo: 'Rodamientos para bomba',
      tipoRequisicionId: 't1',
      areaId: 'a1',
      lineas: [{ descripcion: 'Rodamiento 6204', cantidadSolicitada: 3, precioEstimado: 1000, inventarioItemId: null }],
    });
    expect(mocks.enviar).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/requisiciones/new1');
  });

  it('requires a justification to send', async () => {
    const user = userEvent.setup();
    renderCreate();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Guardar y enviar' }));
    expect(await screen.findByText('La justificación es obligatoria para enviar')).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates and sends when the justification is present', async () => {
    const user = userEvent.setup();
    renderCreate();
    await fillValid(user);
    await user.type(screen.getByLabelText(/^Justificación/), 'Paro de línea');
    await user.click(screen.getByRole('button', { name: 'Guardar y enviar' }));
    await waitFor(() => expect(mocks.enviar).toHaveBeenCalledWith('new1'));
  }, 20000);

  it('offers the stock item source only when the tenant has basic inventory', () => {
    const { unmount } = renderCreate();
    expect(screen.queryByLabelText('Ítem de stock')).not.toBeInTheDocument();
    unmount();
    mocks.canStock = true;
    renderCreate();
    expect(screen.getByLabelText('Ítem de stock')).toBeInTheDocument();
    expect(screen.getByLabelText('Texto libre')).toBeInTheDocument();
  });

  it('keeps the type immutable on edit and never sends it', async () => {
    mocks.detail = {
      isLoading: false,
      isError: false,
      data: {
        data: {
          _id: 'r1',
          consecutivo: 'REQ-2026-0001',
          titulo: 'Original',
          tipoRequisicionId: 't1',
          areaId: 'a1',
          prioridad: 'Media',
          estado: 'Borrador',
          creadaPor: 'u1',
          justificacion: '',
          montoEstimado: 100,
          lineas: [{ descripcion: 'Tornillo', unidad: 'und', cantidadSolicitada: 1, precioEstimado: 100 }],
        },
      },
    };
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/requisiciones/r1/edit']}>
        <Routes>
          <Route path="/requisiciones/:id/edit" element={<RequisicionFormPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Título *')).toHaveValue('Original'));
    expect(screen.getByLabelText('Tipo *')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    expect(mocks.update.mock.calls[0][0].id).toBe('r1');
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty('tipoRequisicionId');
  });

  it('blocks editing when the requisicion is no longer a draft', () => {
    mocks.detail = {
      isLoading: false,
      isError: false,
      data: { data: { _id: 'r1', consecutivo: 'REQ-1', estado: 'En_Aprobacion', lineas: [] } },
    };
    render(
      <MemoryRouter initialEntries={['/requisiciones/r1/edit']}>
        <Routes>
          <Route path="/requisiciones/:id/edit" element={<RequisicionFormPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Solo se puede editar una requisición en estado Borrador/)).toBeInTheDocument();
  });
});

describe('RequisicionFormPage help hints', () => {
  beforeEach(() => {
    mocks.canStock = true;
    mocks.detail = { data: undefined, isLoading: false, isError: false };
  });

  it('shows a (!) hint on the title, every general field, the lines and both save buttons', () => {
    renderCreate();
    [
      'Ayuda: Formulario de requisición',
      'Ayuda: Título',
      'Ayuda: Tipo',
      'Ayuda: Área',
      'Ayuda: Prioridad',
      'Ayuda: Fecha requerida',
      'Ayuda: Justificación',
      'Ayuda: Líneas',
      'Ayuda: Monto total estimado',
      'Ayuda: Guardar borrador',
      'Ayuda: Guardar y enviar',
    ].forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('shows the line hints (stock vs free text, description, quantity, estimated price)', () => {
    renderCreate();
    [
      'Ayuda: Ítem de stock o texto libre',
      'Ayuda: Descripción y especificaciones',
      'Ayuda: Cantidad y unidad',
      'Ayuda: Precio estimado',
    ].forEach((label) => expect(screen.getAllByRole('button', { name: label }).length).toBeGreaterThan(0));
  });
});
