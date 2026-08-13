import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SendSignedSheetModal from './SendSignedSheetModal';

const mutateAsync = vi.fn().mockResolvedValue({ data: { emailSent: true } });
vi.mock('@/hooks/useShareSignedSheet', () => ({
  useShareSignedSheet: () => ({ mutateAsync, isPending: false }),
}));

function withQC(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

const baseSheet = (overrides: any = {}) =>
  ({
    _id: 'sheet-1',
    numeroHoja: 'HT-0001',
    estado: 'Firmada',
    createdAt: '2026-08-11T00:00:00.000Z',
    ...overrides,
  }) as any;

describe('SendSignedSheetModal', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('prefills email with shareHistory.lastEmail when present', () => {
    render(
      withQC(
        <SendSignedSheetModal
          show
          onHide={() => {}}
          sheet={baseSheet({ shareHistory: { lastEmail: 'last@used.com', sendCount: 2 } })}
          customerEmail="default@client.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.value).toBe('last@used.com');
  });

  it('falls back to customerEmail when shareHistory is empty', () => {
    render(
      withQC(
        <SendSignedSheetModal
          show
          onHide={() => {}}
          sheet={baseSheet()}
          customerEmail="default@client.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.value).toBe('default@client.com');
  });

  it('checkbox "Permitir descargar los reportes" is unchecked by default', () => {
    render(
      withQC(
        <SendSignedSheetModal show onHide={() => {}} sheet={baseSheet()} customerEmail="a@b.com" />
      )
    );
    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('submit sends the current form values (default allowReports=false)', async () => {
    const onHide = vi.fn();
    render(
      withQC(
        <SendSignedSheetModal show onHide={onHide} sheet={baseSheet()} customerEmail="a@b.com" />
      )
    );
    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    fireEvent.click(primary);
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        sheetId: 'sheet-1',
        email: 'a@b.com',
        allowReports: false,
      })
    );
    await waitFor(() => expect(onHide).toHaveBeenCalled());
  });

  it('renders the shareHistory hint when sendCount > 0', () => {
    render(
      withQC(
        <SendSignedSheetModal
          show
          onHide={() => {}}
          sheet={baseSheet({ shareHistory: { lastEmail: 'a@b.com', sendCount: 3, lastSentAt: new Date().toISOString() } })}
          customerEmail=""
        />
      )
    );
    expect(screen.getByText(/Ya enviado 3/i)).toBeInTheDocument();
  });
});
