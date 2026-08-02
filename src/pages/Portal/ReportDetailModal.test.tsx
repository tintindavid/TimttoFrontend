import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportDetailModal from './ReportDetailModal';
import { PortalReportDetail } from '@/types/publicPortal.types';

const mockUseReportDetail = vi.fn();
vi.mock('@/hooks/portal/useReportDetail', () => ({
  useReportDetail: (...args: unknown[]) => mockUseReportDetail(...args),
}));

const mockMarkMutate = vi.fn();
const mockUnmarkMutate = vi.fn();
const mockUpdateNoteMutate = vi.fn();
const mockUseMarkReviewed = vi.fn();
const mockUseUnmarkReviewed = vi.fn();
const mockUseUpdateClientNote = vi.fn();
vi.mock('@/hooks/portal/useMarkReviewed', () => ({
  useMarkReviewed: (...args: unknown[]) => mockUseMarkReviewed(...args),
  useUnmarkReviewed: (...args: unknown[]) => mockUseUnmarkReviewed(...args),
  useUpdateClientNote: (...args: unknown[]) => mockUseUpdateClientNote(...args),
}));

const baseReport: PortalReportDetail = {
  _id: 'r1',
  consecutivo: 'R-0001',
  // Backend gate tightened 2026-08-02: only `Procesado` is reviewable.
  estado: 'Procesado',
  clientReview: null,
  isSheeted: false,
  clientNote: null,
};

describe('ReportDetailModal (iframe view)', () => {
  beforeEach(() => {
    mockUseReportDetail.mockReset();
    mockMarkMutate.mockReset();
    mockUnmarkMutate.mockReset();
    mockUseMarkReviewed.mockReset();
    mockUseUnmarkReviewed.mockReset();
    mockUseMarkReviewed.mockReturnValue({ mutate: mockMarkMutate, isLoading: false, isError: false });
    mockUseUnmarkReviewed.mockReturnValue({ mutate: mockUnmarkMutate, isLoading: false });
    mockUseUpdateClientNote.mockReturnValue({ mutate: mockUpdateNoteMutate, isLoading: false, isError: false });
  });

  it('renders nothing visible when reportId is null (modal hidden)', () => {
    mockUseReportDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: undefined });

    render(<ReportDetailModal token="tok-1" reportId={null} onHide={vi.fn()} />);

    expect(screen.queryByTitle('Reporte')).not.toBeInTheDocument();
    expect(screen.queryByText('Marcar como revisado')).not.toBeInTheDocument();
  });

  it('renders the iframe pointing at /pdf-view for the current token+report', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: baseReport },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    const iframe = screen.getByTitle('Reporte') as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('/public/client-view/tok-1/reports/r1/pdf-view');
  });

  it('shows the "Marcar como revisado" primary button when the report is not reviewed', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: baseReport },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    expect(screen.getByRole('button', { name: /marcar como revisado/i })).toBeInTheDocument();
  });

  it('opens the confirmation modal when marcar-como-revisado is clicked, then fires the mutation on confirm', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: baseReport },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /marcar como revisado/i }));

    // Confirmation modal body appears
    expect(
      screen.getByText(/Al aceptar indicas que el reporte fue revisado/i)
    ).toBeInTheDocument();

    // Mutation NOT fired yet — user has to confirm first
    expect(mockMarkMutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /sí, marcar como revisado/i }));
    expect(mockMarkMutate).toHaveBeenCalledWith('r1', expect.any(Object));
  });

  it('cancel button on the confirmation modal closes it without firing the mutation', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: baseReport },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /marcar como revisado/i }));
    fireEvent.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(mockMarkMutate).not.toHaveBeenCalled();
  });

  it('shows "Quitar revisión" and fires unmark WITHOUT a confirmation modal when already reviewed', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: { ...baseReport, clientReview: { reviewedAt: '2026-08-01T10:00:00.000Z' } } },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    expect(screen.getByText('Revisado')).toBeInTheDocument(); // header badge

    fireEvent.click(screen.getByRole('button', { name: /quitar revisión/i }));

    // No confirmation modal — unmark fires immediately
    expect(mockUnmarkMutate).toHaveBeenCalledWith('r1');
    expect(
      screen.queryByText(/Al aceptar indicas que el reporte fue revisado/i)
    ).not.toBeInTheDocument();
  });

  it('disables the review button when the report is already sheeted', () => {
    mockUseReportDetail.mockReturnValue({
      data: {
        data: { ...baseReport, estado: 'Procesado', isSheeted: true },
      },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /marcar como revisado/i });
    expect(btn).toBeDisabled();
  });

  it('disables the review button when the report estado is not reviewable', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: { ...baseReport, estado: 'Pendiente' } },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /marcar como revisado/i });
    expect(btn).toBeDisabled();
  });

  it('shows a loading spinner while the report detail is fetching', () => {
    mockUseReportDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: undefined });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    expect(screen.getByLabelText('Cargando detalle')).toBeInTheDocument();
  });

  it('shows an error message when the report cannot be loaded', () => {
    mockUseReportDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    expect(screen.getByText('No fue posible encontrar este reporte.')).toBeInTheDocument();
  });

  it('renders the help tooltip button (info icon) next to the review action', () => {
    mockUseReportDetail.mockReturnValue({
      data: { data: baseReport },
      isLoading: false,
      isError: false,
      error: undefined,
    });

    render(<ReportDetailModal token="tok-1" reportId="r1" onHide={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /ayuda sobre la revisión/i })
    ).toBeInTheDocument();
  });
});
