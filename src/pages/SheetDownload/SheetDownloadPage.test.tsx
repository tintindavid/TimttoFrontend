import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SheetDownloadPage from './SheetDownloadPage';

const useDataMock = vi.fn();
vi.mock('@/hooks/useSheetDownloadData', () => ({
  useSheetDownloadData: (...args: any[]) => useDataMock(...args),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/hoja-descarga/abc']}>
        <Routes>
          <Route path="/hoja-descarga/:token" element={<SheetDownloadPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('SheetDownloadPage', () => {
  beforeEach(() => {
    useDataMock.mockReset();
  });

  it('renders the HT button only when allowReports is false', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'active',
          sheetNumero: 'OT-1-1',
          otConsecutivo: null,
          tenantName: 'Tenant',
          expiresAt: '2026-08-14T00:00:00.000Z',
          downloadsAllowed: 3,
          downloadsUsed: 0,
          allowReports: false,
          reportDownloadsAllowed: 0,
          reportDownloadsUsed: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole('button', { name: /descargar hoja de trabajo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /descargar reportes/i })).not.toBeInTheDocument();
  });

  it('renders both buttons when allowReports is true', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'active',
          sheetNumero: 'OT-1-1',
          otConsecutivo: 'OT-2026-001',
          tenantName: 'Tenant',
          expiresAt: '2026-08-14T00:00:00.000Z',
          downloadsAllowed: 3,
          downloadsUsed: 1,
          allowReports: true,
          reportDownloadsAllowed: 2,
          reportDownloadsUsed: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole('button', { name: /descargar hoja de trabajo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar reportes/i })).toBeInTheDocument();
    // counters visible
    expect(screen.getByText(/2 descargas restantes de 3/i)).toBeInTheDocument();
    expect(screen.getByText(/2 descargas restantes de 2/i)).toBeInTheDocument();
  });

  it('renders the exhausted dismissal state', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'exhausted',
          sheetNumero: null,
          otConsecutivo: null,
          tenantName: null,
          expiresAt: '2026-08-14T00:00:00.000Z',
          downloadsAllowed: 3,
          downloadsUsed: 3,
          allowReports: false,
          reportDownloadsAllowed: 0,
          reportDownloadsUsed: 0,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/este enlace ya no tiene descargas disponibles/i)).toBeInTheDocument();
  });
});
