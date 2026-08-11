import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const useItemsMock = vi.fn();
vi.mock('@/hooks/useItems', () => ({
  useItems: (...args: any[]) => useItemsMock(...args),
  useDeleteItem: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/components/common/Pagination', () => ({
  __esModule: true,
  default: () => null,
}));

import ItemsPage from './ItemsPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ItemsPage />
    </MemoryRouter>
  );

beforeEach(() => {
  useItemsMock.mockReset();
  useItemsMock.mockReturnValue({
    data: { data: [], pagination: { page: 1, pages: 1, total: 0 } },
    isLoading: false,
    isFetching: false,
    error: null,
  });
});

describe('ItemsPage — server-side search wiring', () => {
  it('calls useItems with the default sortBy: Nombre and order: asc', () => {
    renderPage();
    expect(useItemsMock).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'Nombre', order: 'asc', page: 1, limit: 20 })
    );
  });

  it('sends the debounced search term to the hook after typing', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    fireEvent.change(input, { target: { value: 'monitor' } });
    await waitFor(
      () =>
        expect(useItemsMock).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'monitor' })
        ),
      { timeout: 1000 }
    );
  });

  it('renders "Mostrando N de M" using pagination.total (not local page length)', () => {
    useItemsMock.mockReturnValue({
      data: {
        data: [{ _id: 'i1', Nombre: 'Uno' }, { _id: 'i2', Nombre: 'Dos' }],
        pagination: { page: 1, pages: 4, total: 78 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText(/Mostrando 2 de 78/i)).toBeInTheDocument();
  });
});
