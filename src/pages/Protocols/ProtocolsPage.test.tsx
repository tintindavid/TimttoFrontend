import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const useProtocolsMock = vi.fn();
const createProtocolMutateMock = vi.fn();
const getByIdMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/hooks/useProtocols', () => ({
  useProtocols: (...args: any[]) => useProtocolsMock(...args),
  useDeleteProtocol: () => ({ mutateAsync: vi.fn() }),
  useCreateProtocol: () => ({ mutateAsync: createProtocolMutateMock, isLoading: false }),
}));

vi.mock('@/services/protocol.service', () => ({
  protocolService: {
    getById: (...args: any[]) => getByIdMock(...args),
  },
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

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
  createProtocolMutateMock.mockReset();
  getByIdMock.mockReset();
  navigateMock.mockReset();
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

describe('ProtocolsPage — Duplicar action', () => {
  beforeEach(() => {
    useProtocolsMock.mockReturnValue({
      data: {
        data: [
          {
            _id: 'src-1',
            nombre: 'Mantenimiento Preventivo Trimestral',
            Descripcion: 'Rutina trimestral',
            actividadesMtto: [
              { _id: 'act-a' },
              { _id: 'act-b' },
            ],
          },
        ],
        pagination: { page: 1, pages: 1, total: 1 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
  });

  it('composes getById + create with the "_copia" suffix and navigates to the copy edit page', async () => {
    getByIdMock.mockResolvedValue({
      data: {
        _id: 'src-1',
        nombre: 'Mantenimiento Preventivo Trimestral',
        Descripcion: 'Rutina trimestral',
        actividadesMtto: [{ _id: 'act-a' }, { _id: 'act-b' }],
      },
    });
    createProtocolMutateMock.mockResolvedValue({
      data: { _id: 'new-1' },
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }));
    fireEvent.click(await screen.findByText(/^duplicar$/i));

    await waitFor(() => expect(getByIdMock).toHaveBeenCalledWith('src-1'));
    await waitFor(() =>
      expect(createProtocolMutateMock).toHaveBeenCalledWith({
        nombre: 'Mantenimiento Preventivo Trimestral_copia',
        Descripcion: 'Rutina trimestral',
        actividadesMtto: ['act-a', 'act-b'],
      })
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/protocols/new-1/edit'));
  });

  it('sends an empty actividadesMtto array when the source has no activities', async () => {
    useProtocolsMock.mockReturnValue({
      data: {
        data: [{ _id: 'src-2', nombre: 'Vacio', Descripcion: '', actividadesMtto: [] }],
        pagination: { page: 1, pages: 1, total: 1 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    getByIdMock.mockResolvedValue({
      data: { _id: 'src-2', nombre: 'Vacio', Descripcion: '', actividadesMtto: [] },
    });
    createProtocolMutateMock.mockResolvedValue({ data: { _id: 'new-2' } });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }));
    fireEvent.click(await screen.findByText(/^duplicar$/i));

    await waitFor(() =>
      expect(createProtocolMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({ actividadesMtto: [], nombre: 'Vacio_copia' })
      )
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/protocols/new-2/edit'));
  });

  it('does not navigate when the create mutation fails', async () => {
    getByIdMock.mockResolvedValue({
      data: {
        _id: 'src-1',
        nombre: 'Mantenimiento Preventivo Trimestral',
        Descripcion: 'Rutina trimestral',
        actividadesMtto: [{ _id: 'act-a' }],
      },
    });
    createProtocolMutateMock.mockRejectedValue(new Error('boom'));

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /acciones/i }));
    fireEvent.click(await screen.findByText(/^duplicar$/i));

    await waitFor(() => expect(createProtocolMutateMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
