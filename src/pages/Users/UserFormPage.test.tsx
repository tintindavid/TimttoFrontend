import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  // Stable reference per user object (the form hydrates in an effect keyed on the response).
  cache: new Map<object, unknown>(),
  userResult: (): unknown => undefined,
  user: { _id: 'u1', firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.co', roleId: 'role-1', areaId: 'a1' } as Record<string, unknown>,
}));

vi.mock('@/hooks/useUsers', () => ({
  useUser: () => mocks.userResult(),
  useCreateUser: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateUser: () => ({ mutateAsync: mocks.update, isLoading: false }),
}));
vi.mock('@/hooks/useRoles', () => ({
  useRoles: () => ({ data: { data: [{ _id: 'role-1', name: 'Admin' }] }, isLoading: false }),
}));
vi.mock('@/hooks/useAreas', () => ({
  useGetAreas: () => ({
    data: {
      data: [
        { _id: 'a1', nombre: 'Mantenimiento', codigo: 'MTO', activa: true, jefesIds: [] },
        { _id: 'a2', nombre: 'Compras', codigo: 'CMP', activa: true, jefesIds: [] },
      ],
    },
  }),
}));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: () => true }),
}));
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

mocks.userResult = () => {
  if (!mocks.cache.has(mocks.user)) mocks.cache.set(mocks.user, { data: { data: mocks.user }, isLoading: false });
  return mocks.cache.get(mocks.user);
};

import UserFormPage from './UserFormPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/users/u1/edit']}>
      <Routes>
        <Route path="/users/:id/edit" element={<UserFormPage />} />
        <Route path="/users" element={<div>listado</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('UserFormPage areaId (M5)', () => {
  beforeEach(() => {
    mocks.update.mockReset().mockResolvedValue({});
    mocks.user = { _id: 'u1', firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.co', roleId: 'role-1', areaId: 'a1' };
  });

  it('does not send areaId when the area did not change', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty('areaId');
  });

  it('does not send areaId when the loaded area is a populated object that did not change', async () => {
    mocks.user = { ...mocks.user, areaId: { _id: 'a1', nombre: 'Mantenimiento' } };
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty('areaId');
  });

  it('sends areaId only when the user picks a different area', async () => {
    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('Área'), 'a2');
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].data.areaId).toBe('a2');
  });

  it('sends null when the area is cleared', async () => {
    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('Área'), '');
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update.mock.calls[0][0].data.areaId).toBeNull();
  });
});
