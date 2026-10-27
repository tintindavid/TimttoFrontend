import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NivelAprobacion, Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({
  reasignar: vi.fn(),
  useUsers: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'me' } }) }));
vi.mock('@/hooks/useRequisiciones', () => ({
  useReasignarAprobadores: () => ({ mutateAsync: mocks.reasignar, isLoading: false }),
}));
vi.mock('@/hooks/useUsers', () => ({ useUsers: (p: unknown) => mocks.useUsers(p) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ReasignarModal from './ReasignarModal';

const nivel = (over: Partial<NivelAprobacion> = {}): NivelAprobacion =>
  ({ orden: 1, nombre: 'Jefe', aprobadorTipo: 'usuarios', aprobadorIds: ['ana'], estado: 'Pendiente', ...over }) as NivelAprobacion;
const req = { _id: 'r1' } as Requisicion;

beforeEach(() => {
  vi.clearAllMocks();
  const response = {
    data: [
      { _id: 'me', firstName: 'Yo', lastName: 'Mismo', email: 'me@x.co' },
      { _id: 'ana', firstName: 'Ana', lastName: 'Ruiz', email: 'a@x.co' },
      { _id: 'bob', firstName: 'Bob', lastName: 'Paz', email: 'b@x.co' },
    ],
    pagination: { total: 120 },
  };
  mocks.useUsers.mockImplementation(() => ({ data: response }));
});

describe('ReasignarModal', () => {
  it('keeps the selection when the parent re-renders with a new niveles array identity', async () => {
    const onHide = vi.fn();
    const { rerender } = render(<ReasignarModal show requisicion={req} niveles={[nivel()]} onHide={onHide} />);
    await userEvent.click(screen.getByLabelText('Aprobadores *'));
    await userEvent.click(await screen.findByText('Bob Paz'));
    expect(screen.getByText('Bob Paz')).toBeInTheDocument();
    rerender(<ReasignarModal show requisicion={req} niveles={[nivel()]} onHide={onHide} />);
    expect(screen.getByText('Bob Paz')).toBeInTheDocument();
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
  });

  it('excludes the current user from the selectable approvers', async () => {
    render(<ReasignarModal show requisicion={req} niveles={[nivel()]} onHide={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Aprobadores *'));
    await screen.findByText('Bob Paz');
    expect(screen.queryByText('Yo Mismo')).not.toBeInTheDocument();
  });

  it('removes the current user from a preselected level', async () => {
    mocks.reasignar.mockResolvedValue({});
    render(<ReasignarModal show requisicion={req} niveles={[nivel({ aprobadorIds: ['me', 'ana'] })]} onHide={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reasignar' }));
    await waitFor(() =>
      expect(mocks.reasignar).toHaveBeenCalledWith({ id: 'r1', data: { nivelOrden: 1, aprobadorIds: ['ana'] } })
    );
  });

  it('shows the user-list limitation and searches on the server', async () => {
    render(<ReasignarModal show requisicion={req} niveles={[nivel()]} onHide={vi.fn()} />);
    expect(screen.getByTestId('reasignar-users-limit')).toHaveTextContent('Mostrando 3 de 120 usuarios');
    await userEvent.type(screen.getByLabelText('Aprobadores *'), 'bo');
    await waitFor(() => expect(mocks.useUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'bo', page: 1 })));
  });

  it('labels a deleted approver neutrally', () => {
    render(
      <ReasignarModal
        show
        requisicion={req}
        niveles={[nivel({ aprobadorIds: [{ _id: 'gone', firstName: 'Usuario', lastName: 'eliminado' }] })]}
        onHide={vi.fn()}
      />
    );
    expect(screen.getByText('Usuario eliminado')).toBeInTheDocument();
  });
});
