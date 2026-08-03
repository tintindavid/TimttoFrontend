import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PortalSheetsHistory from './PortalSheetsHistory';
import { PortalSheet } from '@/types/publicPortal.types';

const mockUseSheetsHistory = vi.fn();
vi.mock('@/hooks/portal/useSheetsHistory', () => ({
  useSheetsHistory: (...args: unknown[]) => mockUseSheetsHistory(...args),
}));

const renderAt = (token = 'tok-123') =>
  render(
    <MemoryRouter initialEntries={[`/portal/${token}/historial`]}>
      <Routes>
        <Route path="/portal/:token/historial" element={<PortalSheetsHistory />} />
      </Routes>
    </MemoryRouter>
  );

describe('PortalSheetsHistory', () => {
  beforeEach(() => {
    mockUseSheetsHistory.mockReset();
  });

  it('renders the empty state when there are no sheets', () => {
    mockUseSheetsHistory.mockReturnValue({
      data: { data: { sheets: [] } },
      isLoading: false,
      isError: false,
    });

    renderAt();

    expect(
      screen.getByText('Aún no has firmado ninguna hoja de trabajo desde este acceso.')
    ).toBeInTheDocument();
  });

  it('renders a ready row with a download link and a pending row with a spinner', () => {
    const sheets: PortalSheet[] = [
      {
        _id: 'sheet-1',
        numeroHoja: 'HT-0001',
        otId: 'ot1',
        otConsecutivo: 'OT-0001',
        signedAt: '2026-07-20T10:00:00.000Z',
        pdfStatus: 'ready',
        pdfUrl: 'https://cdn.example.com/sheet-1.pdf',
      },
      {
        _id: 'sheet-2',
        numeroHoja: 'HT-0002',
        otId: 'ot2',
        otConsecutivo: 'OT-0002',
        signedAt: '2026-07-20T10:05:00.000Z',
        pdfStatus: 'pending',
        pdfUrl: null,
      },
    ];

    mockUseSheetsHistory.mockReturnValue({
      data: { data: { sheets } },
      isLoading: false,
      isError: false,
    });

    renderAt('tok-123');

    expect(screen.getByText('HT-0001')).toBeInTheDocument();
    expect(screen.getByText('HT-0002')).toBeInTheDocument();

    // 2026-08-04: "Descargar PDF" was renamed "Descargar HT" and a second
    // action "Descargar reportes (ZIP)" was added per client transparency ask.
    const htDownload = screen.getByRole('button', { name: 'Descargar HT' });
    expect(htDownload.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('/public/client-view/tok-123/sheets/sheet-1/pdf')
    );

    const reportsDownload = screen.getByRole('button', { name: 'Descargar reportes (ZIP)' });
    expect(reportsDownload.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('/public/client-view/tok-123/sheets/sheet-1/reports-pdf')
    );

    expect(screen.getByText('Generando PDF...')).toBeInTheDocument();
  });

  it('shows an error message when the query fails', () => {
    mockUseSheetsHistory.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderAt();

    expect(screen.getByText('No fue posible cargar el historial.')).toBeInTheDocument();
  });
});
