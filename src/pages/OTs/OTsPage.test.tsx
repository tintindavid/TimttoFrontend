import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

const useOTsMock = vi.fn();
const useDeleteOtMock = vi.fn();
vi.mock('@/hooks/useOTs', () => ({
  useOTs: (...args: any[]) => useOTsMock(...args),
  useDeleteOt: (...args: any[]) => useDeleteOtMock(...args),
}));

const useHasPermissionMock = vi.fn();
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (...args: any[]) => useHasPermissionMock(...args),
}));

const quickDetailModalMock = vi.fn();
vi.mock('@/components/ots/OtQuickDetailModal', () => ({
  __esModule: true,
  default: (props: any) => {
    quickDetailModalMock(props);
    return props.show ? <div data-testid="quick-detail-modal">quick-detail otId={props.otId}</div> : null;
  },
}));

const responsablesModalMock = vi.fn();
vi.mock('@/components/ots/OtResponsablesModal', () => ({
  __esModule: true,
  default: (props: any) => {
    responsablesModalMock(props);
    return props.show ? <div data-testid="responsables-modal">responsables otId={props.otId}</div> : null;
  },
}));

vi.mock('@/components/ots/OtNotasModal', () => ({
  __esModule: true,
  default: () => null,
}));

import OTsPage from './OTsPage';

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
};

const renderPage = (initialEntries: string[] = ['/maintenance-orders']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <OTsPage />
      <LocationDisplay />
    </MemoryRouter>,
  );

const otRow = (overrides: Record<string, unknown> = {}) => ({
  _id: 'ot-1',
  Consecutivo: 'OT-0001',
  ClienteId: { _id: 'cli-1', Razonsocial: 'Cliente Uno', Ciudad: 'Bogotá' },
  TipoServicio: 'Preventivo',
  OtPrioridad: 'Alta',
  EstadoOt: 'Pendiente',
  Avance: 0,
  FechaCreacion: '2026-08-01T00:00:00.000Z',
  programaciones: [],
  ...overrides,
});

beforeEach(() => {
  useOTsMock.mockReset();
  useDeleteOtMock.mockReset();
  useHasPermissionMock.mockReset();
  quickDetailModalMock.mockClear();
  responsablesModalMock.mockClear();

  useDeleteOtMock.mockReturnValue({ mutateAsync: vi.fn() });
  useHasPermissionMock.mockReturnValue(false);
  useOTsMock.mockReturnValue({
    data: { data: [], pagination: { page: 1, pages: 1, total: 0 } },
    isLoading: false,
    isFetching: false,
    error: null,
  });
});

describe('OTsPage — tabs (Todas las OTs / Mis OTs)', () => {
  it('defaults to "Todas las OTs" without mine=true', () => {
    renderPage();
    expect(useOTsMock).toHaveBeenCalledWith(expect.objectContaining({ mine: undefined }));
  });

  it('switching to "Mis OTs" sends mine=true to the hook (server-side filter)', () => {
    renderPage();
    fireEvent.click(screen.getByText('Mis OTs'));
    expect(useOTsMock).toHaveBeenCalledWith(expect.objectContaining({ mine: true }));
  });

  it('shows the "Mis OTs" empty state copy when the tab has no rows', () => {
    renderPage();
    fireEvent.click(screen.getByText('Mis OTs'));
    expect(screen.getByText('Aún no tienes OTs asignadas.')).toBeInTheDocument();
  });
});

describe('OTsPage — Responsable(s) column', () => {
  it('renders stacked snapshotName values for an OT with an active roster', () => {
    useOTsMock.mockReturnValue({
      data: {
        data: [
          otRow({
            programaciones: [
              {
                _id: 'prog-1',
                isActive: true,
                fechaInicio: '2026-08-01',
                fechaFin: '2026-08-30',
                responsables: [
                  { userId: 'u1', snapshotName: 'M. Duran' },
                  { userId: 'u2', snapshotName: 'J. Perez' },
                ],
                createdByName: 'Admin',
                createdAt: '2026-08-01T00:00:00.000Z',
              },
            ],
          }),
        ],
        pagination: { page: 1, pages: 1, total: 1 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText('M. Duran')).toBeInTheDocument();
    expect(screen.getByText('J. Perez')).toBeInTheDocument();
  });

  it('renders an em-dash for an OT without programación', () => {
    useOTsMock.mockReturnValue({
      data: { data: [otRow({ programaciones: [] })], pagination: { page: 1, pages: 1, total: 1 } },
      isLoading: false,
      isFetching: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('OTsPage — "Responsables" dropdown item', () => {
  const setupOneRow = () => {
    useOTsMock.mockReturnValue({
      data: { data: [otRow()], pagination: { page: 1, pages: 1, total: 1 } },
      isLoading: false,
      isFetching: false,
      error: null,
    });
  };

  it('is hidden for a user without ots:manage-responsables', () => {
    useHasPermissionMock.mockReturnValue(false);
    setupOneRow();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '' })); // dropdown toggle (icon-only)
    expect(screen.queryByText('Responsables')).not.toBeInTheDocument();
  });

  it('is visible and opens the modal for a user with ots:manage-responsables', () => {
    useHasPermissionMock.mockReturnValue(true);
    setupOneRow();
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '' })); // dropdown toggle (icon-only)
    fireEvent.click(screen.getByText('Responsables'));
    expect(responsablesModalMock).toHaveBeenCalledWith(expect.objectContaining({ otId: 'ot-1', show: true }));
  });
});

describe('OTsPage — deep-link ?open_ot={id}', () => {
  it('opens OtQuickDetailModal on mount and cleans the URL', async () => {
    renderPage(['/maintenance-orders?open_ot=abc123']);

    await waitFor(() => expect(screen.getByTestId('quick-detail-modal')).toBeInTheDocument());
    expect(screen.getByTestId('quick-detail-modal').textContent).toContain('abc123');

    await waitFor(() => expect(screen.getByTestId('location-search').textContent).toBe(''));
  });

  it('does not open the modal when there is no open_ot param', () => {
    renderPage();
    expect(screen.queryByTestId('quick-detail-modal')).not.toBeInTheDocument();
  });
});
