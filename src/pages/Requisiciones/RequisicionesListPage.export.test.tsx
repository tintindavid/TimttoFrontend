import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PERMISSIONS } from '@/constants/permissions';

const mocks = vi.hoisted(() => ({
  useGetRequisiciones: vi.fn(),
  exportar: vi.fn(),
  toastError: vi.fn(),
  permissions: new Set<string>(),
}));

vi.mock('@/hooks/useRequisiciones', () => ({ useGetRequisiciones: mocks.useGetRequisiciones }));
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarListado: () => ({ mutateAsync: mocks.exportar, isLoading: false }),
}));
vi.mock('@/hooks/useAreas', () => ({ useGetAreas: () => ({ data: { data: [] } }) }));
vi.mock('@/hooks/useTiposRequisicion', () => ({ useGetTiposRequisicion: () => ({ data: { data: [] } }) }));
vi.mock('react-toastify', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (p: string) => mocks.permissions.has(p),
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));

import RequisicionesListPage from './RequisicionesListPage';

const emptyList = {
  data: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 1, hasNext: false, hasPrev: false } },
  isLoading: false,
  isFetching: false,
  isError: false,
};

const renderPage = (initialEntry = '/requisiciones', vista: 'mias' | 'mi-historial' = 'mias') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RequisicionesListPage vista={vista} />
    </MemoryRouter>
  );

describe('RequisicionesListPage - exports and dashboard links', () => {
  beforeEach(() => {
    mocks.permissions.clear();
    mocks.exportar.mockReset().mockResolvedValue(undefined);
    mocks.toastError.mockReset();
    mocks.useGetRequisiciones.mockReset().mockReturnValue(emptyList);
  });

  it('hides "Exportar Excel" without requisiciones:reports', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Exportar Excel' })).not.toBeInTheDocument();
  });

  it('exports with the active filters and vista, without pagination', async () => {
    mocks.permissions.add(PERMISSIONS.REQUISICIONES_REPORTS);
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrar por estado'), { target: { value: 'Cerrada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() => expect(mocks.exportar).toHaveBeenCalled());
    const sent = mocks.exportar.mock.calls[0][0] as Record<string, unknown>;
    expect(sent).toMatchObject({ vista: 'mias', estado: 'Cerrada' });
    expect(sent).not.toHaveProperty('page');
    expect(sent).not.toHaveProperty('limit');
  });

  it('shows the total in the message when the server answers 413', async () => {
    mocks.permissions.add(PERMISSIONS.REQUISICIONES_REPORTS);
    mocks.exportar.mockRejectedValue({
      response: { status: 413, data: { error: { code: 'EXPORT_DEMASIADAS_FILAS', details: { total: 7421 } } } },
    });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining('7421')));
    expect(mocks.toastError.mock.calls[0][0]).toContain('demasiadas filas');
  });

  it('sends alcance=tenant and filtro to the API and shows the scope alert', () => {
    renderPage('/requisiciones?alcance=tenant&filtro=licitaciones-vencidas');
    const params = mocks.useGetRequisiciones.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(params).toMatchObject({ alcance: 'tenant', filtro: 'licitaciones-vencidas' });
    expect(params.vista).toBeUndefined();
    expect(screen.getByText(/toda la organización/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar este alcance' })).toBeInTheDocument();
  });

  it('ignores an unknown filtro and sends alcance=tenant with the estado', () => {
    renderPage('/requisiciones?alcance=tenant&filtro=hack&estado=En_Recepcion');
    const params = mocks.useGetRequisiciones.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(params).toMatchObject({ alcance: 'tenant', estado: 'En_Recepcion' });
    expect(params.filtro).toBeUndefined();
  });

  it('does not treat alcance other than tenant as a scope', () => {
    renderPage('/requisiciones?alcance=todas');
    const params = mocks.useGetRequisiciones.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(params.alcance).toBeUndefined();
    expect(params.vista).toBe('mias');
  });

  it('exports exactly the list query on Mi historial (vista and accion included)', async () => {
    mocks.permissions.add(PERMISSIONS.REQUISICIONES_REPORTS);
    renderPage('/requisiciones/mi-historial', 'mi-historial');
    fireEvent.click(screen.getByRole('button', { name: 'Órdenes de compra que emití' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() => expect(mocks.exportar).toHaveBeenCalled());
    const sent = mocks.exportar.mock.calls[0][0] as Record<string, unknown>;
    expect(sent).toMatchObject({ vista: 'mi-historial', accion: 'emiti' });
    expect(sent).not.toHaveProperty('page');
    expect(sent).not.toHaveProperty('limit');
  });

  it('exports the tenant scope and filtro', async () => {
    mocks.permissions.add(PERMISSIONS.REQUISICIONES_REPORTS);
    renderPage('/requisiciones?alcance=tenant&filtro=sin-movimiento');
    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));
    await waitFor(() => expect(mocks.exportar).toHaveBeenCalled());
    expect(mocks.exportar.mock.calls[0][0]).toMatchObject({ alcance: 'tenant', filtro: 'sin-movimiento' });
  });

  it('offers the OC actions in the Mi historial filter', () => {
    renderPage('/requisiciones/mi-historial', 'mi-historial');
    fireEvent.click(screen.getByRole('button', { name: 'Órdenes de compra que emití' }));
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'emiti' }));
    fireEvent.click(screen.getByRole('button', { name: 'Órdenes de compra que aprobé/rechacé' }));
    expect(mocks.useGetRequisiciones).toHaveBeenLastCalledWith(expect.objectContaining({ accion: 'aprobe-oc' }));
  });

  it('links to the Reportes page from the tabs', () => {
    renderPage();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
  });
});
