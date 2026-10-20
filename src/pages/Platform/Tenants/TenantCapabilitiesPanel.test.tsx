import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PlatformTenant } from '@/types';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  mutation: { isLoading: false } as { isLoading: boolean; mutate?: unknown },
}));

vi.mock('@/hooks/usePlatformTenants', () => {
  mocks.mutation.mutate = mocks.mutate;
  return { useUpdateTenantCapabilities: () => mocks.mutation };
});
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import TenantCapabilitiesPanel from './TenantCapabilitiesPanel';

const tenant = (overrides: Partial<PlatformTenant> = {}): PlatformTenant => ({
  _id: 'mongo1',
  tenantId: 'acme',
  name: 'Acme SAS',
  status: 'active',
  isDeleted: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

beforeEach(() => {
  mocks.mutate.mockReset();
});

describe('TenantCapabilitiesPanel', () => {
  it('treats a tenant without capabilities as Prestador', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    expect(screen.getByTestId('current-type').textContent).toBe('Prestador');
    expect(screen.getByRole('button', { name: 'Guardar capacidades' })).toBeDisabled();
  });

  it('asks for confirmation before sending the preset flags', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    expect(mocks.mutate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0]).toEqual({
      id: 'mongo1',
      input: { executesServices: true, registersExternal: true },
    });
  });

  it('rejects leaving both flags off', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByLabelText(/Ejecuta servicios/));
    expect(screen.getByText('Debe quedar activa al menos una capacidad.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar capacidades' })).toBeDisabled();
  });

  it('shows the client choice on 409 and resends with the chosen organizationCustomerId', async () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cliente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    const { onError } = mocks.mutate.mock.calls[0][1];
    onError({
      response: {
        status: 409,
        data: {
          error: {
            code: 'ORGANIZATION_CUSTOMER_REQUIRED',
            details: { customers: [{ _id: 'c1', Razonsocial: 'Cliente A' }, { _id: 'c2', Razonsocial: 'Cliente B' }] },
          },
        },
      },
    });

    const select = await screen.findByLabelText('Cliente de la organización');
    fireEvent.change(select, { target: { value: 'c2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar con este cliente' }));

    expect(mocks.mutate.mock.calls[1][0]).toEqual({
      id: 'mongo1',
      input: { executesServices: false, registersExternal: true, organizationCustomerId: 'c2' },
    });
  });

  it('falls back to a manual id when the 409 carries no candidates', async () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cliente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    mocks.mutate.mock.calls[0][1].onError({
      response: { status: 409, data: { error: { code: 'ORGANIZATION_CUSTOMER_REQUIRED' } } },
    });
    expect(await screen.findByLabelText('ID del cliente de la organización')).toBeTruthy();
  });
});
