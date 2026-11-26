import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepTenantType from './StepTenantType';
import { buildCreatePayload } from './buildCreatePayload';

describe('demo accounts in the onboarding wizard', () => {
  it('lets the organization type be chosen, shows the limits and reports isDemo', () => {
    const onNext = vi.fn();
    render(<StepTenantType onNext={onNext} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cuenta de demostración' }));
    for (const name of ['Prestador', 'Cliente', 'Mixto']) {
      expect(screen.getByRole('radio', { name })).toBeEnabled();
    }
    expect(screen.getByText(/2 usuarios, 3 clientes, 50 equipos/)).toBeTruthy();
    // No organization data is asked of a demo client.
    fireEvent.click(screen.getByRole('radio', { name: 'Cliente' }));
    expect(screen.queryByText(/son obligatorios NIT/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onNext).toHaveBeenCalledWith('client', true);
  });

  it('sends tenant.isDemo with the type and without capabilities', () => {
    const payload = buildCreatePayload({
      type: 'client',
      isDemo: true,
      tenant: { tenantId: 'demo-1', name: 'Demo' },
      admin: { email: 'a@example.com', firstName: 'A', lastName: 'B' },
    });
    expect(payload.tenant.isDemo).toBe(true);
    expect(payload.type).toBe('client');
    expect(payload).not.toHaveProperty('capabilities');
    expect(payload).not.toHaveProperty('isDemo');
  });
});
