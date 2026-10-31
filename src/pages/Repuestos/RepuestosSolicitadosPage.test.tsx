import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  usesRequisiciones: false,
  executesServices: true,
  permissions: new Set<string>(),
  rows: [] as unknown[],
  listSpy: vi.fn(),
  createRequisicion: vi.fn(),
  createOt: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => mocks.navigate,
}));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({
    can: (c: string) => (c === 'usesRequisiciones' ? mocks.usesRequisiciones : c === 'executesServices' ? mocks.executesServices : true),
  }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'u1', areaId: 'a1' } }) }));
vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: () => false,
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [{ _id: 'c1', Razonsocial: 'Cliente Uno' }] } }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({ data: { data: [{ _id: 'a1', nombre: 'Mantenimiento', activa: true }] } }),
}));
vi.mock('@/hooks/useTiposRequisicion', () => ({
  useGetTiposRequisicion: () => ({ data: { data: [{ _id: 't1', nombre: 'Repuestos', codigo: 'REPUESTO', activo: true }] } }),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock('@/hooks/useRepuestos', () => ({
  useRepuestosList: (params: unknown) => {
    mocks.listSpy(params);
    return { data: { data: mocks.rows, pagination: { page: 1, pages: 1 } }, isLoading: false };
  },
  useUpdateRepuesto: () => ({ mutateAsync }),
  useCreateOtFromRepuestos: () => ({ mutateAsync: mocks.createOt, isPending: false }),
  useCreateRequisicionFromSolicitudes: () => ({ mutateAsync: mocks.createRequisicion, isLoading: false }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import RepuestosSolicitadosPage from './RepuestosSolicitadosPage';

const base = {
  EstadoSolicitud: 'Solicitado',
  Cantidad: '1',
  ClienteId: { Razonsocial: 'Cliente Uno' },
  EquipoId: { item: 'Equipo', Marca: 'Marca', Serie: '123' },
  ResponsableSolicitud: { firstName: 'Ana', lastName: 'Perez' },
  ReporteSolicitudId: 'rep1',
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RepuestosSolicitadosPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const rowCheckbox = (name: string) => {
  const row = screen.getByText(name).closest('tr') as HTMLElement;
  return within(row).getByRole('checkbox');
};

describe('RepuestosSolicitadosPage (module off)', () => {
  beforeEach(() => {
    mocks.usesRequisiciones = false;
    mocks.executesServices = true;
    mocks.permissions = new Set(['requisiciones:create', 'requisiciones:manage-all']);
    mocks.listSpy.mockClear();
    mocks.rows = [{ _id: 'r1', nombre: 'Filtro A', ...base }];
  });

  it('renders list and filter controls', () => {
    renderPage();

    expect(screen.getByText('Repuestos solicitados')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar repuesto')).toBeInTheDocument();
    expect(screen.getByText('Filtro A')).toBeInTheDocument();
  });

  it('shows Create OT button when selecting a Solicitado repuesto', () => {
    renderPage();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText(/Crear OT \(1\)/)).toBeInTheDocument();
  });

  it('does not change anything with the module off, even for rows that carry a requisition', () => {
    mocks.rows = [
      { _id: 'r1', nombre: 'Filtro A', ...base, requisicion: { requisicionId: 'q1', consecutivo: 'REQ-1', disponibilidad: 'En_Abastecimiento' } },
    ];
    renderPage();
    fireEvent.click(screen.getByRole('checkbox'));

    expect(screen.queryByText(/Hacer requisición/)).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Requisición/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filtrar por requisición')).not.toBeInTheDocument();
    expect(screen.queryByText('REQ-1')).not.toBeInTheDocument();
    expect(screen.queryByText(/Crear OT sin requisición/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear OT \(1\)/ })).toBeEnabled();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    // The list query carries no requisition filter.
    expect(mocks.listSpy.mock.calls.every(([p]) => !('requisicionEstado' in (p as object)))).toBe(true);
  });
});

describe('RepuestosSolicitadosPage (module on)', () => {
  beforeEach(() => {
    mocks.usesRequisiciones = true;
    mocks.executesServices = true;
    mocks.permissions = new Set(['requisiciones:create', 'requisiciones:send']);
    mocks.listSpy.mockClear();
    mocks.createRequisicion.mockReset();
    mocks.createOt.mockReset();
    mocks.createOt.mockResolvedValue({ data: { ot: { _id: 'ot1' } } });
    mocks.rows = [
      { _id: 'r1', nombre: 'Filtro libre', Prioridad: 'Media', PrecioRepuesto: 50, ...base, Cantidad: '2' },
      {
        _id: 'r2',
        nombre: 'Bomba',
        ...base,
        requisicion: { requisicionId: 'q2', consecutivo: 'REQ-2026-0002', disponibilidad: 'En_Abastecimiento' },
      },
      {
        _id: 'r3',
        nombre: 'Correa',
        ...base,
        requisicion: { requisicionId: 'q3', consecutivo: 'REQ-2026-0003', disponibilidad: 'Disponible' },
      },
    ];
  });

  it('shows the Requisición column with a link and a colored availability badge', () => {
    renderPage();
    expect(screen.getByRole('columnheader', { name: /Requisición/ })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'REQ-2026-0002' });
    expect(link).toHaveAttribute('href', '/requisiciones/q2');
    const table = screen.getByRole('table');
    expect(within(table).getByText('En abastecimiento')).toHaveClass('bg-primary');
    expect(within(table).getByText('Disponible')).toHaveClass('bg-success');
  });

  it('shows hints for the new controls', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Ayuda: Columna Requisición' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ayuda: Filtrar por requisición' })).toBeInTheDocument();
  });

  it('sends the requisition filter to the list query', async () => {
    renderPage();
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por requisición'), 'Disponible');
    const last = mocks.listSpy.mock.calls[mocks.listSpy.mock.calls.length - 1][0] as Record<string, unknown>;
    expect(last.requisicionEstado).toBe('Disponible');
  });

  it('offers Hacer requisición for unlinked rows and opens the prefilled modal', async () => {
    renderPage();
    fireEvent.click(rowCheckbox('Filtro libre'));
    const button = screen.getByRole('button', { name: /Hacer requisición \(1\)/ });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Título *')).toHaveValue('Requisición: Filtro libre');
    expect(within(dialog).getByLabelText('Cantidad de Filtro libre')).toHaveValue(2);
  });

  it('disables Hacer requisición when the selection includes a row already linked', () => {
    renderPage();
    fireEvent.click(rowCheckbox('Filtro libre'));
    fireEvent.click(rowCheckbox('Bomba'));
    expect(screen.getByRole('button', { name: /Hacer requisición \(2\)/ })).toBeDisabled();
  });

  it('hides Hacer requisición without the create permission', () => {
    mocks.permissions = new Set();
    renderPage();
    fireEvent.click(rowCheckbox('Filtro libre'));
    expect(screen.queryByText(/Hacer requisición/)).not.toBeInTheDocument();
  });

  it('disables Crear OT with an explanation while a selected row is not available', () => {
    renderPage();
    fireEvent.click(rowCheckbox('Bomba'));
    expect(screen.getByRole('button', { name: /Crear OT \(1\)/ })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent(/requisición aún no está disponible/);
    // No manage-all: no way to skip the requisition.
    expect(screen.queryByText(/Crear OT sin requisición/)).not.toBeInTheDocument();
  });

  it('explains that unlinked rows need a requisition first', () => {
    renderPage();
    fireEvent.click(rowCheckbox('Filtro libre'));
    expect(screen.getByRole('button', { name: /Crear OT \(1\)/ })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent(/Hay solicitudes sin requisición/);
  });

  it('enables Crear OT when every selected row is Disponible', () => {
    renderPage();
    fireEvent.click(rowCheckbox('Correa'));
    expect(screen.getByRole('button', { name: /Crear OT \(1\)/ })).toBeEnabled();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('lets a manage-all user skip the requisition with a mandatory reason', async () => {
    mocks.permissions = new Set(['requisiciones:manage-all']);
    renderPage();
    fireEvent.click(rowCheckbox('Filtro libre'));
    await userEvent.click(screen.getByRole('button', { name: 'Crear OT sin requisición' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Continuar' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Motivo de la excepción/), 'Urgencia en planta');
    expect(confirm).toBeEnabled();
  });
});
