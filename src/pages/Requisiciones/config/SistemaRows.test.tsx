import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  updateTipo: vi.fn(),
  tipos: [] as unknown[],
  areas: [] as unknown[],
  presupuestos: [] as unknown[],
}));

const page = (rows: unknown[]) => ({
  data: rows,
  pagination: { page: 1, limit: 20, total: rows.length, pages: 1, hasNext: false, hasPrev: false },
});

vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: () => true,
  useCurrentUserPermissions: () => ({ has: () => true, hasAny: () => true, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useTiposRequisicion', () => ({
  useGetTiposRequisicion: () => ({ data: page(mocks.tipos), isLoading: false, isFetching: false, isError: false }),
  useCreateTipoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateTipoRequisicion: () => ({ mutateAsync: mocks.updateTipo, isLoading: false }),
  useDeleteTipoRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({ data: page(mocks.areas), isLoading: false, isFetching: false, isError: false }),
  useCreateArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/usePresupuestosArea', () => ({
  useGetPresupuestosArea: () => ({ data: page(mocks.presupuestos), isLoading: false, isFetching: false, isError: false }),
  useCreatePresupuestoArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdatePresupuestoArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeletePresupuestoArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useGetPresupuestoResumen: () => ({ isLoading: false, isError: false, data: { data: { configurado: false } } }),
}));
vi.mock('@/hooks/useUsers', () => ({ useUsers: () => ({ data: { data: [] } }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import TiposPage, { TipoFormModal } from './TiposPage';
import AreasPage from './AreasPage';
import PresupuestosPage from './PresupuestosPage';
import { REQUISICION_ERROR_MESSAGES } from '@/types/requisicion.types';

const wrap = (node: React.ReactElement) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('system (default) rows', () => {
  beforeEach(() => {
    mocks.updateTipo.mockReset().mockResolvedValue({});
    mocks.tipos = [
      { _id: 't1', codigo: 'GENERAL', nombre: 'General', activo: true, esSistema: true },
      { _id: 't2', codigo: 'PROPIO', nombre: 'Propio', activo: true },
    ];
    mocks.areas = [{ _id: 'a1', codigo: 'COMPRAS', nombre: 'Compras', jefesIds: [], activa: true, esSistema: true }];
    mocks.presupuestos = [{ _id: 'p1', areaId: { _id: 'a1', nombre: 'Administración' }, periodo: '2026', monto: 1, esSistema: true }];
  });

  it('TiposPage badges system rows and disables only their delete button', () => {
    wrap(<TiposPage />);
    expect(screen.getAllByText('Por defecto')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Eliminar General' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar Propio' })).toBeEnabled();
  });

  it('AreasPage badges and locks delete for system areas', () => {
    wrap(<AreasPage />);
    expect(screen.getByText('Por defecto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar Compras' })).toBeDisabled();
  });

  it('PresupuestosPage badges and locks delete for the system budget', () => {
    wrap(<PresupuestosPage />);
    expect(screen.getByText('Por defecto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar presupuesto 2026' })).toBeDisabled();
  });

  it('PresupuestosPage edit modal keeps area and period disabled with explanation', async () => {
    wrap(<PresupuestosPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Editar presupuesto 2026' }));
    await screen.findByText(/no se pueden cambiar/);
    expect(document.getElementById('pres-area')).toBeDisabled();
    expect(document.getElementById('pres-periodo')).toBeDisabled();
  });

  it('TipoFormModal disables name and active for system rows but still sends the full object', async () => {
    wrap(<TipoFormModal show tipo={mocks.tipos[0] as never} onHide={vi.fn()} />);
    expect(document.getElementById('tipo-nombre')).toBeDisabled();
    expect(screen.getByLabelText('Tipo activo')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(mocks.updateTipo).toHaveBeenCalledWith({ id: 't1', data: { nombre: 'General', descripcion: '', activo: true } })
    );
  });

  it('maps REGISTRO_SISTEMA to a Spanish message', () => {
    expect(REQUISICION_ERROR_MESSAGES.REGISTRO_SISTEMA).toMatch(/no se pueden eliminar, desactivar ni renombrar/);
  });
});
