import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ updateArea: vi.fn(), updateRegla: vi.fn() }));

vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: () => true,
  useCurrentUserPermissions: () => ({ has: () => true, hasAny: () => true, permissions: [], isSuperadmin: false }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useCreateArea: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateArea: () => ({ mutateAsync: mocks.updateArea, isLoading: false }),
}));
vi.mock('@/hooks/useReglasAprobacion', () => ({
  useCreateReglaAprobacion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateReglaAprobacion: () => ({ mutateAsync: mocks.updateRegla, isLoading: false }),
}));
vi.mock('@/hooks/useRoles', () => ({ useRoles: () => ({ data: { data: [] } }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { AreaFormModal } from './AreasPage';
import { ReglaFormModal } from './ReglasPage';

describe('system rows in edit modals', () => {
  beforeEach(() => {
    mocks.updateArea.mockReset().mockResolvedValue({});
    mocks.updateRegla.mockReset().mockResolvedValue({});
  });

  it('AreaFormModal locks name/active but sends the full object', async () => {
    const area = { _id: 'a1', codigo: 'COMPRAS', nombre: 'Compras', jefesIds: [], activa: true, esSistema: true };
    render(
      <MemoryRouter>
        <AreaFormModal show area={area as never} users={[]} onHide={vi.fn()} />
      </MemoryRouter>
    );
    expect(document.getElementById('area-nombre')).toBeDisabled();
    expect(document.getElementById('area-activa')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(mocks.updateArea).toHaveBeenCalledWith({
        id: 'a1',
        data: { nombre: 'Compras', descripcion: '', jefesIds: [], activa: true },
      })
    );
  });

  it('ReglaFormModal locks name/active but sends the full object', async () => {
    const regla = {
      _id: 'r1', orden: 1, nombre: 'Jefe de área', montoDesde: 0, montoHasta: null,
      aprobadorTipo: 'jefe_area', activo: true, esSistema: true,
    };
    render(
      <MemoryRouter>
        <ReglaFormModal show regla={regla as never} allReglas={[regla] as never} users={[]} onHide={vi.fn()} />
      </MemoryRouter>
    );
    expect(document.getElementById('regla-nombre')).toBeDisabled();
    expect(document.getElementById('regla-activo')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(mocks.updateRegla).toHaveBeenCalledWith({
        id: 'r1',
        data: expect.objectContaining({ orden: 1, nombre: 'Jefe de área', montoDesde: 0, montoHasta: null, activo: true }),
      })
    );
  });
});
