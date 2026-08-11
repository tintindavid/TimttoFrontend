import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AddOtsToTokenModal from './AddOtsToTokenModal';
import { ClientAccessToken } from '@/types/clientAccessToken.types';

const mutateAsync = vi.fn().mockResolvedValue({ data: {} });
vi.mock('@/hooks/clientAccessToken/useAddOtsToToken', () => ({
  useAddOtsToToken: () => ({ mutateAsync, isPending: false }),
}));

const useOTsByCustomerMock = vi.fn();
vi.mock('@/hooks/useOTs', () => ({
  useOTsByCustomer: (...args: any[]) => useOTsByCustomerMock(...args),
}));

function withQC(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

const baseToken = (overrides?: Partial<ClientAccessToken>): ClientAccessToken => ({
  _id: 'tok-1',
  tenantId: 't',
  clienteId: 'c-1',
  otIds: ['ot-existing-1'],
  token: 'plain',
  status: 'active',
  accessCount: 0,
  createdAt: '2026-08-10T00:00:00.000Z',
  ...overrides,
});

describe('AddOtsToTokenModal', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
    useOTsByCustomerMock.mockReset();
  });

  it('excludes OTs already in the token from the list', () => {
    useOTsByCustomerMock.mockReturnValue({
      data: {
        data: [
          { _id: 'ot-existing-1', Consecutivo: 'OT-A', EstadoOt: 'Pendiente', isDeleted: false },
          { _id: 'ot-new-1', Consecutivo: 'OT-B', EstadoOt: 'Pendiente', isDeleted: false },
          { _id: 'ot-new-2', Consecutivo: 'OT-C', EstadoOt: 'Pendiente', isDeleted: false },
        ],
      },
      isLoading: false,
    });
    render(withQC(<AddOtsToTokenModal show onHide={() => {}} token={baseToken()} />));
    expect(screen.queryByText(/OT-A/)).not.toBeInTheDocument();
    expect(screen.getByText(/OT-B/)).toBeInTheDocument();
    expect(screen.getByText(/OT-C/)).toBeInTheDocument();
  });

  it('shows a warning when no OTs are available', () => {
    useOTsByCustomerMock.mockReturnValue({
      data: { data: [{ _id: 'ot-existing-1', Consecutivo: 'OT-A', EstadoOt: 'Pendiente', isDeleted: false }] },
      isLoading: false,
    });
    render(withQC(<AddOtsToTokenModal show onHide={() => {}} token={baseToken()} />));
    expect(screen.getByText(/no hay ots disponibles/i)).toBeInTheDocument();
  });

  it('calls the mutation with the selected otIds and closes on success', async () => {
    useOTsByCustomerMock.mockReturnValue({
      data: {
        data: [
          { _id: 'ot-new-1', Consecutivo: 'OT-B', EstadoOt: 'Pendiente', isDeleted: false },
          { _id: 'ot-new-2', Consecutivo: 'OT-C', EstadoOt: 'Pendiente', isDeleted: false },
        ],
      },
      isLoading: false,
    });
    const onHide = vi.fn();
    render(withQC(<AddOtsToTokenModal show onHide={onHide} token={baseToken()} />));

    // Click the checkbox row for OT-B
    const rows = document.querySelectorAll('tbody tr');
    fireEvent.click(rows[0]);
    fireEvent.click(rows[1]);

    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    fireEvent.click(primary);
    await new Promise((r) => setTimeout(r, 0));

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tok-1', otIds: expect.arrayContaining(['ot-new-1', 'ot-new-2']) })
    );
    expect(onHide).toHaveBeenCalled();
  });
});
