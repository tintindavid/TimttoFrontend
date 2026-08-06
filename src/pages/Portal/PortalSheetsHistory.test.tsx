import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PortalSheetsHistory from './PortalSheetsHistory';
import { PortalSheet } from '@/types/publicPortal.types';

const mockUseSheetsHistory = vi.fn();
vi.mock('@/hooks/portal/useSheetsHistory', () => ({
  useSheetsHistory: (...args: unknown[]) => mockUseSheetsHistory(...args),
}));

// `SignatureModal` pulls in `useSign`/`useSignExistingSheet`/`useQueryClient`
// and the whole signature-capture UI — out of scope for this page's unit
// tests. Stub it to a marker that exposes the props this page is
// responsible for wiring (`show`, `mode`, `sheetId`).
vi.mock('./SignatureModal', () => ({
  default: (props: { show: boolean; mode?: string; sheetId?: string; onHide: () => void }) =>
    props.show ? (
      <div data-testid="signature-modal" data-mode={props.mode} data-sheet-id={props.sheetId}>
        <button onClick={props.onHide}>close-modal</button>
      </div>
    ) : null,
}));

const renderAt = (token = 'tok-123') =>
  render(
    <MemoryRouter initialEntries={[`/portal/${token}/historial`]}>
      <Routes>
        <Route path="/portal/:token/historial" element={<PortalSheetsHistory />} />
      </Routes>
    </MemoryRouter>
  );

const readySheet = (overrides: Partial<PortalSheet> = {}): PortalSheet => ({
  _id: 'sheet-1',
  numeroHoja: 'HT-0001',
  otId: 'ot1',
  otConsecutivo: 'OT-0001',
  signedAt: '2026-07-20T10:00:00.000Z',
  pdfStatus: 'ready',
  pdfUrl: 'https://cdn.example.com/sheet-1.pdf',
  firmaFile: 'https://cdn.example.com/firmas/sheet-1.png',
  ...overrides,
});

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
      readySheet(),
      {
        _id: 'sheet-2',
        numeroHoja: 'HT-0002',
        otId: 'ot2',
        otConsecutivo: 'OT-0002',
        signedAt: '2026-07-20T10:05:00.000Z',
        pdfStatus: 'pending',
        pdfUrl: null,
        firmaFile: 'https://cdn.example.com/firmas/sheet-2.png',
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

  describe('late-sign icon (portal-signature-flow)', () => {
    it('does not render the icon for a sheet that already has a signature', () => {
      mockUseSheetsHistory.mockReturnValue({
        data: { data: { sheets: [readySheet({ firmaFile: 'https://cdn.example.com/firmas/s.png' })] } },
        isLoading: false,
        isError: false,
      });

      renderAt();

      expect(screen.queryByTitle('Firmar hoja')).not.toBeInTheDocument();
    });

    it('renders the icon when firmaFile is null', () => {
      mockUseSheetsHistory.mockReturnValue({
        data: { data: { sheets: [readySheet({ firmaFile: null })] } },
        isLoading: false,
        isError: false,
      });

      renderAt();

      expect(screen.getByTitle('Firmar hoja')).toBeInTheDocument();
    });

    it('clicking the icon opens SignatureModal in mode="late" with the sheet id', () => {
      mockUseSheetsHistory.mockReturnValue({
        data: { data: { sheets: [readySheet({ _id: 'sheet-9', firmaFile: null })] } },
        isLoading: false,
        isError: false,
      });

      renderAt('tok-123');

      expect(screen.queryByTestId('signature-modal')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTitle('Firmar hoja'));

      const modal = screen.getByTestId('signature-modal');
      expect(modal).toHaveAttribute('data-mode', 'late');
      expect(modal).toHaveAttribute('data-sheet-id', 'sheet-9');
    });

    it('closing the modal hides it again', () => {
      mockUseSheetsHistory.mockReturnValue({
        data: { data: { sheets: [readySheet({ firmaFile: null })] } },
        isLoading: false,
        isError: false,
      });

      renderAt();

      fireEvent.click(screen.getByTitle('Firmar hoja'));
      expect(screen.getByTestId('signature-modal')).toBeInTheDocument();

      fireEvent.click(screen.getByText('close-modal'));
      expect(screen.queryByTestId('signature-modal')).not.toBeInTheDocument();
    });
  });
});
