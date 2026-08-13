import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OtHeader from './OtHeader';

const baseOt = (overrides: any = {}) =>
  ({
    _id: 'ot-1',
    Consecutivo: 'OT-2026-001',
    ClienteId: { _id: 'cust-1', Razonsocial: 'Cliente Uno', Ciudad: 'Bogotá', Email: 'a@b.com' },
    ...overrides,
  }) as any;

describe('OtHeader — customer name link', () => {
  it('wraps the customer name in an anchor targeting /customers/:id in a new tab', () => {
    render(<OtHeader ot={baseOt()} equiposProcesados={0} totalEquipos={0} />);
    const link = screen.getByRole('link', { name: /cliente uno/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/customers/cust-1');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
  });

  it('renders the customer name as plain text when ClienteId._id is missing', () => {
    render(
      <OtHeader
        ot={baseOt({ ClienteId: { Razonsocial: 'Sin ID' } })}
        equiposProcesados={0}
        totalEquipos={0}
      />
    );
    expect(screen.queryByRole('link', { name: /sin id/i })).not.toBeInTheDocument();
    expect(screen.getByText('Sin ID')).toBeInTheDocument();
  });
});
