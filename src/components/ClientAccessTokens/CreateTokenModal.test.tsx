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

  it('submits the selected OTs and shows the public URL step', async () => {
    mutateAsync.mockResolvedValueOnce({
      data: { id: 'tok1', token: 'abc123', url: 'https://app.timtto.co/portal/abc123' },
    });

    renderModal();

    fireEvent.click(screen.getByLabelText(/OT-001/));
    const submitButton = screen.getByRole('button', { name: 'Crear acceso' });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ clienteId: 'c1', otIds: ['ot1'] });
    });

    expect(await screen.findByText('https://app.timtto.co/portal/abc123')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Acceso creado correctamente.');
  });

  it('shows a friendly error toast when the admin has no signature on file', async () => {
    mutateAsync.mockRejectedValueOnce({
      response: {
        data: {
          message: 'user signature missing',
          error: { code: 'USER_SIGNATURE_MISSING' },
        },
      },
    });

    renderModal();

    fireEvent.click(screen.getByLabelText(/OT-001/));
    fireEvent.click(screen.getByRole('button', { name: 'Crear acceso' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Tu perfil no tiene firma cargada. Súbela desde tu perfil antes de emitir accesos cliente.'
      );
    });
  });
});
