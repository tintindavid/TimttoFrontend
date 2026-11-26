import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepTenantType from './StepTenantType';
import { buildCreatePayload } from './buildCreatePayload';

describe('demo accounts in the onboarding wizard', () => {
  it('disables the organization type, shows the limits and reports isDemo', () => {
    const onNext = vi.fn();
    render(<StepTenantType onNext={onNext} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cuenta de demostración' }));
    for (const name of ['Prestador', 'Cliente', 'Mixto']) {
      expect(screen.getByRole('radio', { name })).toBeDisabled();
    }
    expect(screen.getByText(/2 usuarios, 3 clientes, 50 equipos/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onNext).toHaveBeenCalledWith('provider', true);
  });

  it('sends tenant.isDemo without type nor capabilities', () => {
    const payload = buildCreatePayload({
      type: 'client',
      isDemo: true,
      tenant: { tenantId: 'demo-1', name: 'Demo' },
      admin: { email: 'a@example.com', firstName: 'A', lastName: 'B' },
    });
    expect(payload.tenant.isDemo).toBe(true);
    expect(payload).not.toHaveProperty('type');
    expect(payload).not.toHaveProperty('capabilities');
    expect(payload).not.toHaveProperty('isDemo');
  });
});
