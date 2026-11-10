import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { REQUISICION_QUERY_KEYS, type Requisicion } from '@/types/requisicion.types';
import { miActividadLabel } from '@/utils/requisicionHistorial.utils';

const mocks = vi.hoisted(() => ({
  useGetRequisiciones: vi.fn(),
  navigate: vi.fn(),
}));

// E5: the export buttons use mutations; these suites render without a QueryClient.
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarListado: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarComparativo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useRequisiciones', () => ({ useGetRequisiciones: mocks.useGetRequisiciones }));
vi.mock('@/hooks/useAreas', () => ({ useGetAreas: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useTiposRequisicion', () => ({ useGetTiposRequisicion: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: () => false,
  useCurrentUserPermissions: () => ({ has: () => false, hasAny: () => false, permissions: [], isSuperadmin: false }),
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
  estado: 'Cerrada',
  creadaPor: { _id: 'u1', firstName: 'Ana', lastName: 'Ruiz' } as never,
  lineas: [],
  montoEstimado: 1500000,
  version: 1,
  createdAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

const listResult = (rows: Requisicion[]) => ({
  data: { data: rows, pagination: { page: 1, limit: 20, total: rows.length, pages: 1, hasNext: false, hasPrev: false } },
  isLoading: false,
  isFetching: false,
  isError: false,
});

const renderPage = (vista: 'mias' | 'mi-historial' = 'mi-historial') =>
  render(
    <MemoryRouter>
      <RequisicionesListPage vista={vista} />
    </MemoryRouter>
  );

describe('RequisicionesListPage - Mi historial', () => {
  beforeEach(() => {
    mocks.navigate.mockClear();
    mocks.useGetRequisiciones.mockReset();
  });

  it('shows the "Mi historial" tab to everybody and navigates to it', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    renderPage('mias');
    fireEvent.click(screen.getByText('Mi historial'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones/mi-historial');
  });

  it('asks for vista=mi-historial with accion=todo and only sends accepted params', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage();
    const params = mocks.useGetRequisiciones.mock.calls[0][0] as Record<string, unknown>;
    expect(params).toMatchObject({ vista: 'mi-historial', accion: 'todo', page: 1 });
    Object.keys(params).forEach((key) => expect(REQUISICION_QUERY_KEYS as readonly string[]).toContain(key));
  });

  it('does not send accion in the other tabs', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage('mias');
    expect(mocks.useGetRequisiciones.mock.calls[0][0]).toMatchObject({ accion: undefined });
    expect(screen.queryByRole('group', { name: 'Filtrar por tu acción' })).not.toBeInTheDocument();
  });

  it('hides the sort control but keeps the other filters in Mi historial', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage();
    expect(screen.queryByText('Más recientes primero')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Buscar requisiciones')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrar por estado')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha desde')).toBeInTheDocument();
  });

  it('segmented filter sets accion and resets to page 1', () => {
    mocks.useGetRequisiciones.mockReturnValue({
      ...listResult([row()]),
      data: { data: [row()], pagination: { page: 1, limit: 20, total: 60, pages: 3, hasNext: true, hasPrev: false } },
    });
    renderPage();
    fireEvent.click(screen.getByText('2', { selector: '.page-link' }));
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'todo', page: 2 }));
    fireEvent.click(screen.getByRole('button', { name: 'Aprobé' }));
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(
      expect.objectContaining({ vista: 'mi-historial', accion: 'aprobe', page: 1 })
    );
    expect(screen.getByRole('button', { name: 'Aprobé' })).toHaveAttribute('aria-pressed', 'true');
    ['Todo', 'Rechacé', 'Recibí', 'Confirmé', 'Creé', 'Adjudiqué'].forEach((name) =>
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    );
  });

  it('renders the "Tu acción" column with the latest event, date and +n', () => {
    mocks.useGetRequisiciones.mockReturnValue(
      listResult([
        row({
          miActividad: [
            { tipo: 'NIVEL_APROBADO', fecha: '2026-11-12T12:00:00.000Z', nivel: 2 },
            { tipo: 'CREADA', fecha: '2026-10-01T10:00:00.000Z' },
          ],
        }),
      ])
    );
    renderPage();
    expect(screen.getByText('Tu acción')).toBeInTheDocument();
    expect(screen.getByText(/Aprobaste nivel 2 · /)).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('Cerrada', { selector: 'span' })).toBeInTheDocument();
  });

  it('opens the detail from the row action', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([row()]));
    renderPage();
    fireEvent.click(screen.getByLabelText('Ver REQ-2026-0001'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/requisiciones/r1');
  });

  it('shows the empty state and the filtered variant', () => {
    mocks.useGetRequisiciones.mockReturnValue(listResult([]));
    renderPage();
    expect(screen.getByText('Aún no hay requisiciones en las que hayas actuado.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recibí' }));
    expect(screen.getByText('Ninguna requisición coincide con los filtros.')).toBeInTheDocument();
  });

  it('maps every own event type to a Spanish phrase', () => {
    expect(miActividadLabel({ tipo: 'RECHAZADA', fecha: '' })).toBe('Rechazaste');
    expect(miActividadLabel({ tipo: 'NIVEL_RECHAZADO', fecha: '' })).toBe('Rechazaste');
    expect(miActividadLabel({ tipo: 'ENTREGA_DISPUTADA', fecha: '' })).toBe('Reportaste un problema con la entrega');
    expect(miActividadLabel({ tipo: 'COMPRA_DIRECTA_JUSTIFICADA', fecha: '' })).toBe('Adjudicaste por compra directa');
  });
});
