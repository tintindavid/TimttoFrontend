import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import CreateTokenModal from './CreateTokenModal';

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useOTs', () => ({
  useOTsByCustomer: () => ({
    data: {
      data: [
        { _id: 'ot1', Consecutivo: 'OT-001', EstadoOt: 'Abierta', isDeleted: false },
        { _id: 'ot2', Consecutivo: 'OT-002', EstadoOt: 'En Proceso', isDeleted: false },
        { _id: 'ot3', Consecutivo: 'OT-003', EstadoOt: 'Cerrada', isDeleted: false },
      ],
    },
    isLoading: false,
  }),
}));

// New (2026-08-03): the modal loads users with fileFirma to populate the
// "Técnico que firmará" selector. `technician-a` gets picked when we want
// to exercise the attribution branch.
vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({
    data: {
      data: [
        { _id: 'me', fullName: 'Me Admin', email: 'me@test.co' },
        { _id: 'tech1', fullName: 'Tech One', email: 't1@test.co' },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'me', fullName: 'Me Admin', email: 'me@test.co', role: 'admin' },
  }),
}));

const mutateAsync = vi.fn();
vi.mock('@/hooks/clientAccessToken/useClientTokens', () => ({
  useCreateClientToken: () => ({ mutateAsync, isLoading: false }),
}));

const renderModal = (show = true) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateTokenModal show={show} onHide={vi.fn()} clienteId="c1" />
    </QueryClientProvider>
  );
};

describe('CreateTokenModal', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    vi.clearAllMocks();
  });

  it('renders the non-Cerrada OTs of the client by default', () => {
    renderModal();

    expect(screen.getByText(/OT-001/)).toBeInTheDocument();
    expect(screen.getByText(/OT-002/)).toBeInTheDocument();
    expect(screen.queryByText(/OT-003/)).not.toBeInTheDocument();
  });

  it('disables submit when no OT is selected', () => {
    renderModal();

    const submitButton = screen.getByRole('button', { name: 'Crear acceso' });
    expect(submitButton).toBeDisabled();
  });

  it('submits the selected OTs without attributionUserId when using the default (Yo)', async () => {
    mutateAsync.mockResolvedValueOnce({
      data: { id: 'tok1', token: 'abc123', url: 'https://app.timtto.co/portal/abc123' },
    });

    renderModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /OT-001/i }));
    const submitButton = screen.getByRole('button', { name: 'Crear acceso' });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ clienteId: 'c1', otIds: ['ot1'] });
    });

    expect(await screen.findByText('https://app.timtto.co/portal/abc123')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Acceso creado correctamente.');
  });

  it('sends attributionUserId when the admin picks another técnico', async () => {
    mutateAsync.mockResolvedValueOnce({
      data: { id: 'tok2', token: 'xyz789', url: 'https://app.timtto.co/portal/xyz789' },
    });

    renderModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /OT-001/i }));
    fireEvent.change(screen.getByLabelText(/Técnico que firmará/), {
      target: { value: 'tech1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear acceso' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        clienteId: 'c1',
        otIds: ['ot1'],
        attributionUserId: 'tech1',
      });
    });
  });

  it('shows a friendly error toast when the attributed técnico has no firma', async () => {
    mutateAsync.mockRejectedValueOnce({
      response: {
        data: {
          message: 'user signature missing',
          error: { code: 'USER_SIGNATURE_MISSING' },
        },
      },
    });

    renderModal();

    fireEvent.click(screen.getByRole('checkbox', { name: /OT-001/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear acceso' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'El técnico seleccionado no tiene firma cargada. Elige otro o pídele que la suba.'
      );
    });
  });
});
