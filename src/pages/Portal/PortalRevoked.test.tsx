import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortalRevoked from './PortalRevoked';

describe('PortalRevoked', () => {
  it('renders the revocation message and formatted date, without any client data', () => {
    render(<PortalRevoked revokedAt="2026-07-15T14:30:00.000Z" />);

    expect(screen.getByText('Este acceso fue revocado')).toBeInTheDocument();
    expect(screen.getByText(/Revocado el/)).toBeInTheDocument();

    // No client/OT data should ever be rendered by this component.
    expect(screen.queryByText(/OT-/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Consecutivo/)).not.toBeInTheDocument();
  });

  it('renders the message without a date section when revokedAt is missing', () => {
    render(<PortalRevoked revokedAt={null} />);

    expect(screen.getByText('Este acceso fue revocado')).toBeInTheDocument();
    expect(screen.queryByText(/Revocado el/)).not.toBeInTheDocument();
  });
});
