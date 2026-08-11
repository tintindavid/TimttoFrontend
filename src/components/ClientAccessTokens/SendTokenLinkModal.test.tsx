import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SendTokenLinkModal from './SendTokenLinkModal';
import { ClientAccessToken } from '@/types/clientAccessToken.types';

const mutateAsync = vi.fn().mockResolvedValue({ data: { emailSent: true } });
vi.mock('@/hooks/clientAccessToken/useSendTokenLink', () => ({
  useSendTokenLink: () => ({ mutateAsync, isPending: false }),
}));

function withQC(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

const baseToken = (overrides?: Partial<ClientAccessToken>): ClientAccessToken => ({
  _id: 'tok-1',
  tenantId: 't',
  clienteId: 'c-1',
  otIds: [],
  token: 'plain',
  status: 'active',
  accessCount: 0,
  createdAt: '2026-08-10T00:00:00.000Z',
  ...overrides,
});

describe('SendTokenLinkModal', () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it('prefills the email input with emailHistory.lastEmail when present', () => {
    render(
      withQC(
        <SendTokenLinkModal
          show
          onHide={() => {}}
          token={baseToken({ emailHistory: { lastEmail: 'last@used.com', sendCount: 2 } })}
          customerEmail="default@client.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.value).toBe('last@used.com');
  });

  it('falls back to customerEmail when emailHistory is empty', () => {
    render(
      withQC(
        <SendTokenLinkModal
          show
          onHide={() => {}}
          token={baseToken()}
          customerEmail="default@client.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(input.value).toBe('default@client.com');
  });

  it('renders the correousados datalist options', () => {
    render(
      withQC(
        <SendTokenLinkModal
          show
          onHide={() => {}}
          token={baseToken()}
          customerEmail=""
          correousados={['a@x.com', 'b@y.com']}
        />
      )
    );
    expect(document.querySelector('option[value="a@x.com"]')).toBeTruthy();
    expect(document.querySelector('option[value="b@y.com"]')).toBeTruthy();
  });

  it('disables submit when email is invalid', () => {
    render(withQC(<SendTokenLinkModal show onHide={() => {}} token={baseToken()} customerEmail="" />));
    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    expect(primary).toBeDisabled();
  });

  it('calls the mutation with the (possibly edited) email and closes on success', async () => {
    const onHide = vi.fn();
    render(
      withQC(
        <SendTokenLinkModal
          show
          onHide={onHide}
          token={baseToken()}
          customerEmail="old@client.com"
        />
      )
    );
    const input = document.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new@client.com' } });
    const primary = document.querySelector('.btn-primary') as HTMLButtonElement;
    fireEvent.click(primary);
    await new Promise((r) => setTimeout(r, 0));
    expect(mutateAsync).toHaveBeenCalledWith({ id: 'tok-1', email: 'new@client.com' });
    expect(onHide).toHaveBeenCalled();
  });
});
