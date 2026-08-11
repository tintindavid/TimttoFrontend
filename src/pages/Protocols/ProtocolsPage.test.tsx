import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const useProtocolsMock = vi.fn();
vi.mock('@/hooks/useProtocols', () => ({
  useProtocols: (...args: any[]) => useProtocolsMock(...args),
  useDeleteProtocol: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/components/common/Pagination', () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock('@/components/common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}));

import ProtocolsPage from './ProtocolsPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProtocolsPage />
    </MemoryRouter>
  );

beforeEach(() => {
  useProtocolsMock.mockReset();
  useProtocolsMock.mockReturnValue({
    data: { data: [], pagination: { page: 1, pages: 1, total: 0 } },
    isLoading: false,
    isFetching: false,
    error: null,
  });
});

describe('ProtocolsPage — server-side search wiring', () => {
  it('calls useProtocols with the default sortBy: nombre and order: asc', () => {
    renderPage();
    expect(useProtocolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'nombre', order: 'asc', page: 1, limit: 20 })
    );
  });

  it('sends the debounced search term to the hook after typing', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/buscar protocolos/i);
    fireEvent.change(input, { target: { value: 'monitor' } });
    await waitFor(
      () =>
        expect(useProtocolsMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'monitor' })
        ),
      { timeout: 1000 }
    );
  });

  it('renders the visible count from pagination.total, not the local page length', () => {
    useProtocolsMock.mockReturnValue({
      data: {
        data: [{ _id: 'p1', nombre: 'Uno' }, { _id: 'p2', nombre: 'Dos' }],
        pagination: { page: 1, pages: 3, total: 55 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage();
    // "Mostrando 2 de 55"
    expect(screen.getByText(/Mostrando 2 de 55/i)).toBeInTheDocument();
  });
});
