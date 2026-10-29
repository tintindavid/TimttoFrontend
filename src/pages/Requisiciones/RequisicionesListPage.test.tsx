import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { REQUISICION_QUERY_KEYS, REQUISICION_SORT_FIELDS, type Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  useGetRequisiciones: vi.fn(),
  permissions: new Set<string>(),
  navigate: vi.fn(),
}));

vi.mock('@/hooks/useRequisiciones', () => ({ useGetRequisiciones: mocks.useGetRequisiciones }));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({ data: { data: [{ _id: 'a1', nombre: 'Mantenimiento', codigo: 'MTO', jefesIds: [], activa: true }] } }),
}));
vi.mock('@/hooks/useTiposRequisicion', () => ({
  useGetTiposRequisicion: () => ({ data: { data: [{ _id: 't1', nombre: 'Repuestos', codigo: 'REP', activo: true }] } }),
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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import RequisicionesListPage from './RequisicionesListPage';

const row = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0001',
  titulo: 'Rodamientos',
  tipoRequisicionId: { _id: 't1', nombre: 'Repuestos' } as never,
  areaId: { _id: 'a1', nombre: 'Mantenimiento' } as never,
  prioridad: 'Alta',
  estado: 'En_Aprobacion',
  creadaPor: { _id: 'u1', firstName: 'Ana', lastName: 'Ruiz' } as never,
  lineas: [],
  montoEstimado: 1500000,
  version: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

const listResult = (rows: Requisicion[], total = rows.length) => ({
  data: { data: rows, pagination: { page: 1, limit: 20, total, pages: 1, hasNext: false, hasPrev: false } },
  isLoading: false,
  isFetching: false,
  isError: false,
});

const renderPage = (vista: 'mias' | 'por-aprobar' | 'por-recibir' | 'por-confirmar' = 'mias') =>
  render(
    <MemoryRouter>
      <RequisicionesListPage vista={vista} />
    </MemoryRouter>
  );

describe('RequisicionesListPage', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['requisiciones:create']);
    mocks.navigate.mockClear();
    mocks.useGetRequisiciones.mockReset();
  });

  it('renders rows with a colored state badge and the "Mostrando N de M" counter', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()], 35));
    renderPage();
    expect(screen.getByText('REQ-2026-0001')).toBeInTheDocument();
    const badge = screen.getByText('En aprobación', { selector: 'span' });
    expect(badge).toHaveClass('bg-warning');
    expect(screen.getByText('Mostrando 1 de 35 requisiciones')).toBeInTheDocument();
  });

  it('asks the server for the "mias" view with page size 20', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage('mias');
    expect(mocks.useGetRequisiciones).toHaveBeenCalledWith(expect.objectContaining({ vista: 'mias', page: 1, limit: 20 }));
  });

  it('only sends query params and sort fields the backend accepts', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage('por-aprobar');
    const params = mocks.useGetRequisiciones.mock.calls[0][0] as Record<string, unknown>;
    Object.keys(params).forEach((key) => expect(REQUISICION_QUERY_KEYS as readonly string[]).toContain(key));
    expect(REQUISICION_SORT_FIELDS as readonly string[]).toContain(params.sortBy);
    expect(['asc', 'desc']).toContain(params.order);
  });

  it('shows the empty state of the inbox', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    renderPage('por-aprobar');
    expect(screen.getByText('No tienes requisiciones pendientes por aprobar.')).toBeInTheDocument();
  });

  it('shows the filtered empty state after choosing a status', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target: { value: 'Aprobada' } });
    expect(screen.getByText('Ninguna requisición coincide con los filtros.')).toBeInTheDocument();
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(expect.objectContaining({ estado: 'Aprobada' }));
  });

  it('shows the error state', () => {
    mocks.useGetRequisiciones.mockReturnValue({ data: undefined, isLoading: false, isFetching: false, isError: true });
    renderPage();
    expect(screen.getByText('Error al cargar las requisiciones.')).toBeInTheDocument();
  });

  it('hides "Por aprobar" and the create button without permissions', () => {
    mocks.permissions = new Set();
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage();
    expect(screen.queryByText('Por aprobar')).not.toBeInTheDocument();
    expect(screen.queryByText('Nueva requisición')).not.toBeInTheDocument();
  });

  it('shows "Por aprobar" for approvers and navigates there', () => {
    mocks.permissions = new Set(['requisiciones:approve', 'requisiciones:create']);
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage();
    fireEvent.click(screen.getByText('Por aprobar'));
    expect(mocks.navigate).toHaveBeenCalledWith('/requisiciones/por-aprobar');
    fireEvent.click(screen.getByText('Nueva requisición'));
    expect(mocks.navigate).toHaveBeenCalledWith('/requisiciones/new');
  });
});

describe('RequisicionesListPage help hints', () => {
  beforeEach(() => {
    mocks.permissions = new Set(['requisiciones:create', 'requisiciones:approve']);
    mocks.useGetRequisiciones.mockReset();
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
  });

  it('shows a (!) hint on the title, tabs, search, every filter, the states legend and the create button', () => {
    renderPage();
    [
      'Ayuda: Listado de requisiciones',
      'Ayuda: Mis requisiciones',
      'Ayuda: Por aprobar',
      'Ayuda: Buscar requisiciones',
      'Ayuda: Estados de una requisición',
      'Ayuda: Filtrar por área',
      'Ayuda: Filtrar por tipo',
      'Ayuda: Filtrar por fecha de creación',
      'Ayuda: Orden del listado',
      'Ayuda: Nueva requisición',
    ].forEach((label) => expect(screen.getByRole('button', { name: label })).toBeInTheDocument());
  });

  it('opens the module guide from the header', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Guía del módulo/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Guía del módulo de requisiciones');
    expect(screen.getByRole('heading', { name: '1. Creación' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '9. Próximas fases' })).toBeInTheDocument();
  });

  it('shows the title hint of the approver inbox in the "por-aprobar" view', () => {
    renderPage('por-aprobar');
    expect(screen.getAllByRole('button', { name: 'Ayuda: Por aprobar' }).length).toBeGreaterThan(0);
  });
});

describe('RequisicionesListPage reception views', () => {
  beforeEach(() => {
    mocks.permissions = new Set();
    mocks.navigate.mockClear();
    mocks.useGetRequisiciones.mockReset();
    mocks.useGetRequisiciones.mockReturnValue(listResult([row({ estado: 'En_Recepcion' })]));
  });

  it('shows the Por recibir tab only with the receive (or manage-all) permission', () => {
    const { unmount } = renderPage();
    expect(screen.queryByRole('button', { name: 'Por recibir' })).not.toBeInTheDocument();
    unmount();

    mocks.permissions = new Set(['requisiciones:receive']);
    const second = renderPage();
    expect(screen.getByRole('button', { name: 'Por recibir' })).toBeInTheDocument();
    second.unmount();

    mocks.permissions = new Set(['requisiciones:manage-all']);
    renderPage();
    expect(screen.getByRole('button', { name: 'Por recibir' })).toBeInTheDocument();
  });

  it('always shows Por confirmar and navigates to each view', () => {
    mocks.permissions = new Set(['requisiciones:receive']);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Por confirmar' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones/por-confirmar');
    fireEvent.click(screen.getByRole('button', { name: 'Por recibir' }));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones/por-recibir');
  });

  it('asks the server for the por-recibir / por-confirmar views and shows the new states and empty messages', () => {
    renderPage('por-recibir');
    expect(mocks.useGetRequisiciones).toHaveBeenCalledWith(expect.objectContaining({ vista: 'por-recibir' }));
    expect(screen.getByText('En recepción', { selector: 'span' })).toHaveClass('bg-primary');

    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    const second = renderPage('por-confirmar');
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(expect.objectContaining({ vista: 'por-confirmar' }));
    expect(screen.getByText('No tienes entregas pendientes de confirmar.')).toBeInTheDocument();
    second.unmount();
    renderPage('por-recibir');
    expect(screen.getByText('No hay requisiciones pendientes de recibir.')).toBeInTheDocument();
  });

  it('offers the new states in the status filter', () => {
    renderPage();
    const select = screen.getByLabelText('Filtrar por estado');
    expect(select).toHaveTextContent('En recepción');
    expect(select).toHaveTextContent('Cerrada');
  });
});
