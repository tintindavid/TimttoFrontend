import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PortalHome from './PortalHome';
import { PortalConsolidatedView } from '@/types/publicPortal.types';

const mockUsePortalConsolidated = vi.fn();
vi.mock('@/hooks/portal/usePortalData', () => ({
  usePortalConsolidated: (...args: unknown[]) => mockUsePortalConsolidated(...args),
}));

const mockUseReportDetail = vi.fn();
vi.mock('@/hooks/portal/useReportDetail', () => ({
  useReportDetail: (...args: unknown[]) => mockUseReportDetail(...args),
}));

// PortalHome renders ReportDetailModal, which calls useMarkReviewed +
// useUnmarkReviewed + useUpdateClientNote (all hit useQueryClient). Mock
// them here so this suite doesn't need a QueryClientProvider wrapper.
vi.mock('@/hooks/portal/useMarkReviewed', () => ({
  useMarkReviewed: () => ({ mutate: vi.fn(), isLoading: false }),
  useUnmarkReviewed: () => ({ mutate: vi.fn(), isLoading: false }),
  useUpdateClientNote: () => ({ mutate: vi.fn(), isLoading: false, isError: false }),
}));

/**
 * Fixture reflects the tab layout shipped 2026-08-02: the portal groups
 * reports into "Para revisar" (Procesado, not sheeted), "Cerrados", and
 * "Pendientes". Cancelado reports are hidden entirely.
 */
const consolidatedView: PortalConsolidatedView = {
  tenant: { name: 'Timtto SAS', logoUrl: null },
  cliente: { name: 'Clínica Ejemplo' },
  ots: [
    {
      _id: 'ot1',
      Consecutivo: 'OT-0001',
      EstadoOt: 'Abierta',
      Avance: 40,
      reports: [
        {
          _id: 'r1',
          consecutivo: 'R-0001',
          estado: 'Procesado',
          clientReview: null,
          isSheeted: false,
          equipoSnapshot: { ItemText: 'Monitor de signos vitales', Marca: 'Mindray', Modelo: 'X1', Serie: 'S1' },
          fechaFinalizado: '2026-07-01T10:00:00.000Z',
        },
        {
          _id: 'r2',
          consecutivo: 'R-0002',
          estado: 'Cerrado',
          clientReview: null,
          isSheeted: false,
          equipoSnapshot: { ItemText: 'Bomba de infusión', Marca: 'B.Braun', Modelo: 'X2', Serie: 'S2' },
          fechaFinalizado: null,
        },
        {
          _id: 'rHidden',
          consecutivo: 'R-CANCEL',
          estado: 'Cancelado',
          clientReview: null,
          isSheeted: false,
          equipoSnapshot: { ItemText: 'Equipo cancelado', Marca: 'X', Modelo: 'Y', Serie: 'Z' },
          fechaFinalizado: null,
        },
      ],
    },
  ],
};

const renderAt = (token = 'tok-123') =>
  render(
    <MemoryRouter initialEntries={[`/portal/${token}`]}>
      <Routes>
        <Route path="/portal/:token" element={<PortalHome />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PortalHome', () => {
  beforeEach(() => {
    mockUsePortalConsolidated.mockReset();
    mockUseReportDetail.mockReset();
    mockUseReportDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: undefined });
  });

  it('shows the empty state when the token has no OTs', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: { ...consolidatedView, ots: [] } },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    expect(
      screen.getByText('No hay órdenes de trabajo asociadas a este acceso.')
    ).toBeInTheDocument();
  });

  it('default tab "Para revisar" shows only Procesado reports; hides Cerrado, Pendiente, Cancelado', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: consolidatedView },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    expect(screen.getByText('Monitor de signos vitales')).toBeInTheDocument(); // Procesado
    expect(screen.queryByText('Bomba de infusión')).not.toBeInTheDocument(); // Cerrado → other tab
    expect(screen.queryByText('Equipo cancelado')).not.toBeInTheDocument(); // Cancelado → hidden entirely
  });

  it('Cerrados tab exposes Cerrado reports on demand', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: consolidatedView },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    // Tab label carries a badge with the count; click switches the panel.
    fireEvent.click(screen.getByRole('tab', { name: /Cerrados/ }));
    expect(screen.getByText('Bomba de infusión')).toBeInTheDocument();
    // Cancelado stays hidden even on the Cerrados tab (only Cerrado shows).
    expect(screen.queryByText('Equipo cancelado')).not.toBeInTheDocument();
  });

  it('Cancelado reports never appear on any tab', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: consolidatedView },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    for (const tabName of ['Para revisar', 'Cerrados', 'Pendientes']) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(tabName) }));
      expect(screen.queryByText('Equipo cancelado')).not.toBeInTheDocument();
    }
  });

  it('renders PortalRevoked when the query fails with 410', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 410, data: { revokedAt: '2026-07-15T00:00:00.000Z' } } },
    });

    renderAt();

    expect(screen.getByText('Este acceso fue revocado')).toBeInTheDocument();
  });

  it('opens the ReportDetailModal on report row click (from Para revisar tab)', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: consolidatedView },
      isLoading: false,
      isError: false,
      error: undefined,
    });
    mockUseReportDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: undefined,
    });

    renderAt();

    fireEvent.click(screen.getByText('Monitor de signos vitales'));

    expect(screen.getByLabelText('Cargando detalle')).toBeInTheDocument();
  });

  it('sign button is disabled when nothing is reviewed', () => {
    mockUsePortalConsolidated.mockReturnValue({
      data: { data: consolidatedView },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    const signButton = screen.getByRole('button', { name: 'Firmar 0 reportes' });
    expect(signButton).toBeInTheDocument();
    expect(signButton).toBeDisabled();
  });

  it('sign button enables and counts reviewed-not-sheeted reports across OTs', () => {
    const multiOtView: PortalConsolidatedView = {
      ...consolidatedView,
      ots: [
        {
          ...consolidatedView.ots[0],
          reports: [
            { ...consolidatedView.ots[0].reports[0], clientReview: { reviewedAt: '2026-07-05T00:00:00.000Z' } },
            consolidatedView.ots[0].reports[1],
            consolidatedView.ots[0].reports[2],
          ],
        },
        {
          _id: 'ot2',
          Consecutivo: 'OT-0002',
          EstadoOt: 'Abierta',
          Avance: 60,
          reports: [
            {
              _id: 'r3',
              consecutivo: 'R-0003',
              estado: 'Procesado',
              isSheeted: false,
              clientReview: { reviewedAt: '2026-07-06T00:00:00.000Z' },
              equipoSnapshot: { ItemText: 'Desfibrilador', Marca: 'Zoll', Modelo: 'X3', Serie: 'S3' },
              fechaFinalizado: '2026-07-06T00:00:00.000Z',
            },
            {
              _id: 'r4',
              consecutivo: 'R-0004',
              estado: 'Procesado',
              isSheeted: false,
              clientReview: null,
              equipoSnapshot: { ItemText: 'Ventilador', Marca: 'Drager', Modelo: 'X4', Serie: 'S4' },
              fechaFinalizado: null,
            },
            {
              // Already sheeted → does NOT count even with clientReview set.
              _id: 'r5',
              consecutivo: 'R-0005',
              estado: 'Procesado',
              isSheeted: true,
              clientReview: { reviewedAt: '2026-07-07T00:00:00.000Z' },
              equipoSnapshot: { ItemText: 'Incubadora', Marca: 'GE', Modelo: 'X5', Serie: 'S5' },
              fechaFinalizado: null,
            },
          ],
        },
      ],
    };

    mockUsePortalConsolidated.mockReturnValue({
      data: { data: multiOtView },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    const signButton = screen.getByRole('button', { name: 'Firmar 2 reportes' });
    expect(signButton).toBeInTheDocument();
    expect(signButton).not.toBeDisabled();
  });

  it('reports with clientNote show a Nota badge on their row', () => {
    const withNote: PortalConsolidatedView = {
      ...consolidatedView,
      ots: [
        {
          ...consolidatedView.ots[0],
          reports: [
            {
              ...consolidatedView.ots[0].reports[0],
              clientNote: { text: 'Equipo fuera de servicio', updatedAt: '2026-08-02T10:00:00.000Z' },
            },
          ],
        },
      ],
    };

    mockUsePortalConsolidated.mockReturnValue({
      data: { data: withNote },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    renderAt();

    expect(screen.getByText('Nota')).toBeInTheDocument();
  });
});
