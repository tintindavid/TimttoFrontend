import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TokenList from './TokenList';
import { ClientAccessToken } from '@/types/clientAccessToken.types';

const baseToken: ClientAccessToken = {
  _id: 't1',
  tenantId: 'tenant1',
  clienteId: 'c1',
  otIds: ['ot1', 'ot2'],
  token: 'abc123',
  status: 'active',
  accessCount: 4,
  lastAccessedAt: '2026-07-01T12:00:00.000Z',
  createdAt: '2026-06-01T09:00:00.000Z',
};

describe('TokenList', () => {
  it('shows the empty state when there are no tokens', () => {
    render(
      <TokenList
        tokens={[]}
        isLoading={false}
        isError={false}
        onRevoke={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByText('Este cliente no tiene accesos generados todavía.')
    ).toBeInTheDocument();
  });

  it('renders a row with the status badge and counters', () => {
    render(
      <TokenList
        tokens={[baseToken]}
        isLoading={false}
        isError={false}
        onRevoke={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('triggers the revoke confirmation callback for an active token', () => {
    const onRevoke = vi.fn();
    render(
      <TokenList
        tokens={[baseToken]}
        isLoading={false}
        isError={false}
        onRevoke={onRevoke}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Revocar acceso'));

    expect(onRevoke).toHaveBeenCalledWith(baseToken);
  });

  it('shows the delete action instead of revoke for a revoked token', () => {
    const revokedToken: ClientAccessToken = { ...baseToken, status: 'revoked' };
    render(
      <TokenList
        tokens={[revokedToken]}
        isLoading={false}
        isError={false}
        onRevoke={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Revocado')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar acceso')).toBeInTheDocument();
    expect(screen.queryByLabelText('Revocar acceso')).not.toBeInTheDocument();
  });
});
