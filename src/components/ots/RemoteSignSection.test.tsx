import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RemoteSignSection from './RemoteSignSection';

// Mock the mutation hook so we don't hit axios.
const mutateAsync = vi.fn().mockResolvedValue({ data: { emailSent: true } });
vi.mock('@/hooks/useRemoteSignRequest', () => ({
  useRemoteSignRequest: () => ({ mutateAsync, isPending: false }),
}));

function withQC(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('RemoteSignSection', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('prefills the email input with the client email', () => {
    render(
      withQC(
        <RemoteSignSection
          otId="ot-1"
          reportIds={['r1', 'r2']}
          clientEmail="client@example.com"
        />
      )
    );
    const input = screen.getByPlaceholderText('cliente@empresa.com') as HTMLInputElement;
    expect(input.value).toBe('client@example.com');
  });

  it('renders the correousados datalist options when provided', () => {
    render(
      withQC(
        <RemoteSignSection
          otId="ot-1"
          reportIds={['r1']}
          clientEmail=""
          correousados={['a@x.com', 'b@y.com']}
        />
      )
    );
    // datalist option values are attribute-only, not text nodes
    expect(document.querySelector('option[value="a@x.com"]')).toBeTruthy();
    expect(document.querySelector('option[value="b@y.com"]')).toBeTruthy();
  });

  it('disables submit when the email is invalid', () => {
    render(
      withQC(
        <RemoteSignSection otId="ot-1" reportIds={['r1']} clientEmail="" />
      )
    );
    const button = screen.getByRole('button', { name: /enviar solicitud/i });
    expect(button).toBeDisabled();

    const input = screen.getByPlaceholderText('cliente@empresa.com');
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    expect(button).toBeDisabled();
  });

  it('enables submit and calls the mutation with a valid email', async () => {
    render(
      withQC(
        <RemoteSignSection otId="ot-1" reportIds={['r1']} clientEmail="client@example.com" />
      )
    );
    const button = screen.getByRole('button', { name: /enviar solicitud/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    // wait a tick for the async handler
    await new Promise((r) => setTimeout(r, 0));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        otId: 'ot-1',
        email: 'client@example.com',
        reportIds: ['r1'],
      })
    );
  });
});
