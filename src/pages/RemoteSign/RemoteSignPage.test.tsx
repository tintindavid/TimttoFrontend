import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RemoteSignPage from './RemoteSignPage';

vi.mock('@/components/common/SignatureInput', () => ({
  __esModule: true,
  default: React.forwardRef(() => null),
}));

const useDataMock = vi.fn();
vi.mock('@/hooks/useRemoteSignData', () => ({
  useRemoteSignData: (...args: any[]) => useDataMock(...args),
}));

vi.mock('@/hooks/useSubmitRemoteSign', () => ({
  useSubmitRemoteSign: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/firma/abc']}>
        <Routes>
          <Route path="/firma/:token" element={<RemoteSignPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RemoteSignPage', () => {
  beforeEach(() => {
    useDataMock.mockReset();
  });

  it('renders the signature form when status is active', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'active',
          expiresAt: '2026-08-20T00:00:00.000Z',
          sheet: { _id: 's', numeroHoja: 'OT-1-1', otConsecutivo: null, clienteNombre: 'X', estado: 'EnviadaAFirmar' },
          tenant: { name: 'Tenant', logoUrl: null },
          previewHtml: '<html>PREVIEW</html>',
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Firmar hoja de trabajo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /firmar y enviar/i })).toBeInTheDocument();
  });

  it('renders the read-only download section when status is signed and PDF is ready', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'signed',
          expiresAt: '2026-08-20T00:00:00.000Z',
          sheet: { _id: 's', numeroHoja: 'OT-1-1', otConsecutivo: null, clienteNombre: 'X', estado: 'Firmada' },
          tenant: { name: 'Tenant', logoUrl: null },
          pdfStatus: 'ready',
          pdfUrl: 'https://firebase/x.pdf',
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByRole('button', { name: /descargar pdf firmado/i })).toBeInTheDocument();
  });

  it('polls / shows spinner when status is signed but PDF is still pending', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'signed',
          expiresAt: '2026-08-20T00:00:00.000Z',
          sheet: { _id: 's', numeroHoja: 'OT-1-1', otConsecutivo: null, clienteNombre: 'X', estado: 'Firmada' },
          tenant: { name: 'Tenant', logoUrl: null },
          pdfStatus: 'pending',
          pdfUrl: null,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/generando pdf firmado/i)).toBeInTheDocument();
  });

  it('renders the expired screen when status is expired', () => {
    useDataMock.mockReturnValue({
      data: {
        data: {
          status: 'expired',
          expiresAt: '2026-08-01T00:00:00.000Z',
          sheet: { _id: 's', numeroHoja: null, otConsecutivo: null, clienteNombre: null, estado: 'EnviadaAFirmar' },
          tenant: { name: null, logoUrl: null },
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/este enlace ha expirado/i)).toBeInTheDocument();
  });
});
