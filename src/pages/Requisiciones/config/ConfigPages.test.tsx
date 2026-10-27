import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  createRegla: vi.fn(),
  updateRegla: vi.fn(),
  createArea: vi.fn(),
  createPresupuesto: vi.fn(),
  reglas: [] as unknown[],
  warnings: undefined as unknown[] | undefined,
  areas: [] as unknown[],
}));

vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (p: string) => mocks.permissions.has(p),
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useReglasAprobacion', () => ({
  useGetReglasAprobacion: () => ({ data: { data: mocks.reglas, warnings: mocks.warnings }, isLoading: false, isError: false }),
  useCreateReglaAprobacion: () => ({ mutateAsync: mocks.createRegla, isLoading: false }),
  useUpdateReglaAprobacion: () => ({ mutateAsync: mocks.updateRegla, isLoading: false }),
  useDeleteReglaAprobacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({
    data: { data: mocks.areas, pagination: { page: 1, limit: 20, total: mocks.areas.length, pages: 1, hasNext: false, hasPrev: false } },
    isLoading: false,
    isFetching: false,
    isError: false,
  }),
  useCreateArea: () => ({ mutateAsync: mocks.createArea, isLoading: false }),
  useUpdateArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/usePresupuestosArea', () => ({
  useGetPresupuestosArea: () => ({
    data: {
      data: [{ _id: 'p1', areaId: 'a1', periodo: '2026', monto: 1000, umbralAlerta: 80 }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1, hasNext: false, hasPrev: false },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
  }),
  useCreatePresupuestoArea: () => ({ mutateAsync: mocks.createPresupuesto, isLoading: false }),
  useUpdatePresupuestoArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeletePresupuestoArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useGetPresupuestoResumen: () => ({
    isLoading: false,
    isError: false,
    data: { data: { configurado: true, monto: 1000, consumido: 200, comprometido: 100, disponible: 700, porcentaje: 30, alerta: false, sobrepasado: false } },
  }),
}));
vi.mock('@/hooks/useTiposRequisicion', () => ({
  useGetTiposRequisicion: () => ({
    data: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 1, hasNext: false, hasPrev: false } },
    isLoading: false,
    isFetching: false,
    isError: false,
  }),
  useCreateTipoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateTipoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteTipoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useRoles', () => ({
  useRoles: () => ({ data: { data: [{ _id: 'role-1', name: 'Dirección' }] } }),
}));
vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ data: { data: [{ _id: 'u1', firstName: 'Ana', lastName: 'Ruiz', email: 'ana@x.co' }] } }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ReglasPage from './ReglasPage';
import AreasPage from './AreasPage';
import PresupuestosPage from './PresupuestosPage';
import TiposPage from './TiposPage';

const wrap = (node: React.ReactElement) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('ReglasPage', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['approval-rules:read', 'approval-rules:create', 'approval-rules:update']);
    mocks.createRegla.mockReset().mockResolvedValue({});
    mocks.warnings = undefined;
    mocks.reglas = [
      { _id: 'r1', orden: 1, nombre: 'Jefe de área', montoDesde: 0, montoHasta: 5000000, aprobadorTipo: 'jefe_area', activo: true },
    ];
  });

  it('shows the non-blocking warnings returned with the rules list', () => {
    mocks.warnings = ['El nivel 1 no cubre montos superiores a 5.000.000', { mensaje: 'Sin nivel superior' }];
    wrap(<ReglasPage />);
    const alert = screen.getByTestId('reglas-warnings');
    expect(alert).toHaveTextContent('El nivel 1 no cubre montos superiores');
    expect(alert).toHaveTextContent('Sin nivel superior');
    expect(screen.getByText('Jefe de área')).toBeInTheDocument();
  });

  it('renders object warnings {tipo, mensaje, nivelOrden} with the level number', () => {
    mocks.warnings = [{ tipo: 'HUECO_DE_MONTO', mensaje: 'Hay un hueco de montos', nivelOrden: 2 }];
    wrap(<ReglasPage />);
    expect(screen.getByTestId('reglas-warnings')).toHaveTextContent('Nivel 2: Hay un hueco de montos');
  });

  it('shows no warnings alert when the list has none', () => {
    wrap(<ReglasPage />);
    expect(screen.queryByTestId('reglas-warnings')).not.toBeInTheDocument();
  });

  it('lists one row per level ordered, with the range and approver', () => {
    mocks.reglas = [
      { _id: 'r2', orden: 2, nombre: 'Dirección', montoDesde: 5000000, montoHasta: null, aprobadorTipo: 'rol', rolId: 'role-1', activo: true },
      ...mocks.reglas,
    ];
    wrap(<ReglasPage />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Jefe de área');
    expect(rows[1]).toHaveTextContent('Dirección');
    expect(rows[1]).toHaveTextContent('sin límite');
    expect(rows[1]).toHaveTextContent('Rol: Dirección');
    expect(screen.getByText('Mostrando 2 de 2 niveles')).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    mocks.reglas = [];
    wrap(<ReglasPage />);
    expect(screen.getByText('Aún no hay niveles de aprobación configurados.')).toBeInTheDocument();
  });

  it('warns live about overlapping ranges and a duplicated order', async () => {
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    const orden = await screen.findByLabelText('Orden *');
    await user.clear(orden);
    await user.type(orden, '1');
    await user.clear(screen.getByLabelText('Monto desde *'));
    await user.type(screen.getByLabelText('Monto desde *'), '1000000');
    const hints = await screen.findByTestId('regla-hints');
    expect(hints).toHaveTextContent('Ya existe otro nivel con el mismo orden');
    expect(hints).toHaveTextContent('se traslapa');
  });

  it('validates that "hasta" is greater than "desde" and does not call the API', async () => {
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    await user.type(await screen.findByLabelText('Nombre *'), 'Dirección');
    const orden = screen.getByLabelText('Orden *');
    await user.clear(orden);
    await user.type(orden, '2');
    const desde = screen.getByLabelText('Monto desde *');
    await user.clear(desde);
    await user.type(desde, '5000000');
    await user.type(screen.getByLabelText('Monto hasta'), '4000000');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear nivel' }));
    expect(await screen.findByText('Debe ser mayor que el monto inicial')).toBeInTheDocument();
    expect(mocks.createRegla).not.toHaveBeenCalled();
  });

  it('creates a consistent level without approver fields for jefe_area', async () => {
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    await user.type(await screen.findByLabelText('Nombre *'), 'Dirección');
    const orden = screen.getByLabelText('Orden *');
    await user.clear(orden);
    await user.type(orden, '2');
    const desde = screen.getByLabelText('Monto desde *');
    await user.clear(desde);
    await user.type(desde, '5000000');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear nivel' }));
    await waitFor(() => expect(mocks.createRegla).toHaveBeenCalledTimes(1));
    const payload = mocks.createRegla.mock.calls[0][0];
    expect(payload).toMatchObject({ orden: 2, nombre: 'Dirección', montoDesde: 5000000, montoHasta: null, aprobadorTipo: 'jefe_area' });
    expect(payload).not.toHaveProperty('rolId');
    expect(payload).not.toHaveProperty('usuariosIds');
  });

  it('requires a role when the approver is a role', async () => {
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    await user.type(await screen.findByLabelText('Nombre *'), 'Dirección');
    const orden = screen.getByLabelText('Orden *');
    await user.clear(orden);
    await user.type(orden, '2');
    const desde = screen.getByLabelText('Monto desde *');
    await user.clear(desde);
    await user.type(desde, '5000000');
    await user.selectOptions(screen.getByLabelText('Aprobador *'), 'rol');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear nivel' }));
    expect(await screen.findByText('Selecciona un rol')).toBeInTheDocument();
    expect(mocks.createRegla).not.toHaveBeenCalled();
  });

  it('shows the backend conflicts of REGLAS_INCONSISTENTES', async () => {
    mocks.createRegla.mockRejectedValue({
      response: { data: { message: 'x', error: { code: 'REGLAS_INCONSISTENTES', details: { conflicts: [{ tipo: 'TRASLAPE', orden: 1 }] } } } },
    });
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    await user.type(await screen.findByLabelText('Nombre *'), 'Dirección');
    const orden = screen.getByLabelText('Orden *');
    await user.clear(orden);
    await user.type(orden, '2');
    const desde = screen.getByLabelText('Monto desde *');
    await user.clear(desde);
    await user.type(desde, '5000000');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear nivel' }));
    expect(await screen.findByText(/Los niveles de la regla se traslapan/)).toBeInTheDocument();
    expect(screen.getAllByText(/se traslapa con otro nivel activo/).length).toBeGreaterThan(0);
  });
});

describe('AreasPage', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['areas:read', 'areas:create']);
    mocks.createArea.mockReset().mockResolvedValue({});
    mocks.areas = [];
  });

  it('shows the empty state and the create button', () => {
    wrap(<AreasPage />);
    expect(screen.getByText('Aún no hay áreas configuradas.')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 0 de 0 áreas')).toBeInTheDocument();
  });

  it('hides the create button without permission', () => {
    mocks.permissions = new Set(['areas:read']);
    wrap(<AreasPage />);
    expect(screen.queryByRole('button', { name: /Crear área/ })).not.toBeInTheDocument();
  });

  it('lists areas with heads and creates a new one', async () => {
    mocks.areas = [{ _id: 'a1', nombre: 'Mantenimiento', codigo: 'MTO', jefesIds: [{ _id: 'u1', firstName: 'Ana', lastName: 'Ruiz' }], activa: true }];
    const user = userEvent.setup();
    wrap(<AreasPage />);
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Crear área/ }));
    await user.type(await screen.findByLabelText('Nombre *'), 'Compras');
    await user.type(screen.getByLabelText('Código *'), 'COM');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear área' }));
    await waitFor(() => expect(mocks.createArea).toHaveBeenCalledTimes(1));
    expect(mocks.createArea.mock.calls[0][0]).toMatchObject({ nombre: 'Compras', codigo: 'COM', jefesIds: [], activa: true });
  });

  it('requires name and code', async () => {
    const user = userEvent.setup();
    wrap(<AreasPage />);
    const openers = screen.getAllByRole('button', { name: /Crear área/ });
    await user.click(openers[0]);
    const submit = within(await screen.findByRole('dialog')).getByRole('button', { name: 'Crear área' });
    await user.click(submit);
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El código es obligatorio')).toBeInTheDocument();
    expect(mocks.createArea).not.toHaveBeenCalled();
  });
});

describe('PresupuestosPage', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['budgets:read', 'budgets:create']);
    mocks.createPresupuesto.mockReset().mockResolvedValue({});
    mocks.areas = [{ _id: 'a1', nombre: 'Mantenimiento', codigo: 'MTO', jefesIds: [], activa: true }];
  });

  it('shows each budget with its execution summary', () => {
    wrap(<PresupuestosPage />);
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText(/Disponible/)).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 presupuestos')).toBeInTheDocument();
  });

  it('rejects an invalid period', async () => {
    const user = userEvent.setup();
    wrap(<PresupuestosPage />);
    await user.click(screen.getByRole('button', { name: /Crear presupuesto/ }));
    await user.selectOptions(await screen.findByLabelText('Área *'), 'a1');
    const periodo = screen.getByLabelText('Período *');
    await user.clear(periodo);
    await user.type(periodo, '2026-13');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear presupuesto' }));
    expect(await screen.findByText('Usa el formato AAAA (año) o AAAA-MM (mes)')).toBeInTheDocument();
    expect(mocks.createPresupuesto).not.toHaveBeenCalled();
  });
});

describe('Configuration pages help hints', () => {
  beforeEach(() => {
    mocks.permissions = new Set([
      'approval-rules:read',
      'approval-rules:create',
      'areas:read',
      'areas:create',
      'budgets:read',
      'budgets:create',
      'request-types:read',
      'request-types:create',
    ]);
    mocks.reglas = [];
    mocks.warnings = undefined;
    mocks.areas = [];
  });

  it('Reglas: title, nav, search and the rule form fields', async () => {
    const user = userEvent.setup();
    wrap(<ReglasPage />);
    ['Ayuda: Reglas de aprobación', 'Ayuda: Secciones de configuración', 'Ayuda: Buscar en la configuración'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /Crear nivel/ }));
    await screen.findByLabelText('Orden *');
    ['Ayuda: Orden del nivel', 'Ayuda: Monto desde', 'Ayuda: Monto hasta', 'Ayuda: Tipo de aprobador', 'Ayuda: Nivel activo'].forEach(
      (label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
  });

  it('Areas: title, sort and the area form fields (jefes, activa, immutable code)', async () => {
    const user = userEvent.setup();
    wrap(<AreasPage />);
    ['Ayuda: Áreas', 'Ayuda: Ordenar'].forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Crear área/ }));
    await screen.findByLabelText('Nombre *');
    ['Ayuda: Código del área', 'Ayuda: Jefes del área', 'Ayuda: Área activa'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
  });

  it('Presupuestos: title, filters, execution column and the budget form fields', async () => {
    const user = userEvent.setup();
    wrap(<PresupuestosPage />);
    [
      'Ayuda: Presupuestos por área',
      'Ayuda: Filtrar por área',
      'Ayuda: Filtrar por período',
      'Ayuda: Ejecución del presupuesto',
    ].forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Crear presupuesto/ }));
    await screen.findByLabelText('Monto *');
    ['Ayuda: Área del presupuesto', 'Ayuda: Período', 'Ayuda: Monto del presupuesto', 'Ayuda: Umbral de alerta'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
  });
  it('Tipos: title, search and the type form fields (immutable code, activo)', async () => {
    const user = userEvent.setup();
    wrap(<TiposPage />);
    ['Ayuda: Tipos de requisición', 'Ayuda: Buscar en la configuración', 'Ayuda: Ordenar'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /Crear tipo/ }));
    await screen.findByLabelText('Nombre *');
    ['Ayuda: Código del tipo', 'Ayuda: Tipo activo'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    );
  });
});
