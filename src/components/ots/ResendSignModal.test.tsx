import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResendSignModal from './ResendSignModal';

const mutateAsync = vi.fn().mockResolvedValue({ data: { emailSent: true } });
vi.mock('@/hooks/useResendSignRequest', () => ({
  useResendSignRequest: () => ({ mutateAsync, isPending: false }),
}));

function withQC(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('ResendSignModal', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('prefills the email input with currentEmail when opened', () => {
    render(
      withQC(
        <ResendSignModal
          show
          onHide={() => {}}
          otId="ot-1"
          sheetId="sheet-1"
          currentEmail="old@example.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.value).toBe('old@example.com');
  });

  it('calls the mutation with the (possibly updated) email and closes on success', async () => {
    const onHide = vi.fn();
    render(
      withQC(
        <ResendSignModal
          show
          onHide={onHide}
          otId="ot-1"
          sheetId="sheet-1"
          currentEmail="old@example.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new@example.com' } });
    // The modal has two "Reenviar" targets — the header/footer icon in the
    // parent chrome may match too; scope to the primary variant.
    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    fireEvent.click(primary);
    await new Promise((r) => setTimeout(r, 0));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sheetId: 'sheet-1', email: 'new@example.com' })
    );
    expect(onHide).toHaveBeenCalled();
  });

  it('keeps the submit button disabled when the email is invalid', () => {
    render(
      withQC(
        <ResendSignModal show onHide={() => {}} otId="ot-1" sheetId="s" currentEmail="" />
      )
    );
    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    expect(primary).toBeDisabled();
  });
});
