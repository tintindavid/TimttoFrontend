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
      input: { executesServices: true, registersExternal: true, usesQrs: false, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false },
    });
  });

  it('shows the two premium modules with their business names, both off for a tenant stored before them', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    expect(screen.getByLabelText(/Servicios de terceros/)).not.toBeChecked();
    expect(screen.getByLabelText(/QRs y tickets/)).not.toBeChecked();
  });

  it('turning the QR module on sends usesQrs and keeps the other flags', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByLabelText(/QRs y tickets/));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    expect(screen.getByText(/QRs y tickets: se activa/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0]).toEqual({
      id: 'mongo1',
      input: { executesServices: true, registersExternal: false, usesQrs: true, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false },
    });
  });

  it('a preset does not touch the QR module', () => {
    render(<TenantCapabilitiesPanel tenant={tenant({ capabilities: { executesServices: true, registersExternal: false, usesQrs: true } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0].input).toEqual({ executesServices: true, registersExternal: true, usesQrs: true, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false });
  });

  it('turning only the QR module off warns that printed QR codes will show not found', () => {
    render(<TenantCapabilitiesPanel tenant={tenant({ capabilities: { executesServices: true, registersExternal: false, usesQrs: true } })} />);
    fireEvent.click(screen.getByLabelText(/QRs y tickets/));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    expect(screen.getByText(/no encontrado/)).toBeTruthy();
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
      input: { executesServices: false, registersExternal: true, usesQrs: false, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false, organizationCustomerId: 'c2' },
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

describe('TenantCapabilitiesPanel - Carga rapida desde el cronograma', () => {
  const withModule = () => tenant({ capabilities: { executesServices: true, registersExternal: true, usesQrs: false, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false } });

  it('the switch is disabled and off while "Servicios de terceros" is off', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    const quick = screen.getByLabelText(/Carga rápida desde el cronograma/);
    expect(quick).toBeDisabled();
    expect(quick).not.toBeChecked();
  });

  it('it is enabled once the external module is on, and turning it on sends both flags', () => {
    render(<TenantCapabilitiesPanel tenant={withModule()} />);
    fireEvent.click(screen.getByLabelText(/Carga rápida desde el cronograma/));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    expect(screen.getByText(/Carga rápida desde el cronograma: se activa/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0].input).toEqual({ executesServices: true, registersExternal: true, usesQrs: false, scheduleQuickLoad: true, usesInventoryBasic: false, usesInventoryAdvanced: false });
  });

  it('turning the external module off also turns the quick load off, so the request carries both', () => {
    render(<TenantCapabilitiesPanel tenant={tenant({ capabilities: { executesServices: true, registersExternal: true, usesQrs: false, scheduleQuickLoad: true, usesInventoryBasic: false, usesInventoryAdvanced: false } })} />);
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).toBeChecked();
    fireEvent.click(screen.getByLabelText(/Servicios de terceros/));
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).not.toBeChecked();
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0].input).toEqual({ executesServices: true, registersExternal: false, usesQrs: false, scheduleQuickLoad: false, usesInventoryBasic: false, usesInventoryAdvanced: false });
  });

  it('a preset that turns the external module off turns the quick load off; one that keeps it keeps it', () => {
    render(<TenantCapabilitiesPanel tenant={tenant({ capabilities: { executesServices: true, registersExternal: true, usesQrs: false, scheduleQuickLoad: true, usesInventoryBasic: false, usesInventoryAdvanced: false } })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prestador' }));
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }));
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).not.toBeChecked();
  });

  it('an inconsistent stored pair (quick load without the module) is shown as off', () => {
    render(<TenantCapabilitiesPanel tenant={tenant({ capabilities: { executesServices: true, registersExternal: false, usesQrs: false, scheduleQuickLoad: true, usesInventoryBasic: false, usesInventoryAdvanced: false } })} />);
    expect(screen.getByLabelText(/Carga rápida desde el cronograma/)).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Guardar capacidades' })).toBeDisabled();
  });
});

describe('TenantCapabilitiesPanel - Stock levels', () => {
  const stockTenant = (basic: boolean, advanced: boolean) =>
    tenant({
      capabilities: {
        executesServices: true,
        registersExternal: false,
        usesQrs: false,
        scheduleQuickLoad: false,
        usesInventoryBasic: basic,
        usesInventoryAdvanced: advanced,
      },
    });

  it('advanced is disabled while basic is off', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    expect(screen.getByLabelText(/Stock básico/)).not.toBeChecked();
    expect(screen.getByLabelText(/Stock avanzado/)).toBeDisabled();
  });

  it('turning basic on and then advanced sends both flags', () => {
    render(<TenantCapabilitiesPanel tenant={tenant()} />);
    fireEvent.click(screen.getByLabelText(/Stock básico/));
    fireEvent.click(screen.getByLabelText(/Stock avanzado/));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0].input).toMatchObject({ usesInventoryBasic: true, usesInventoryAdvanced: true });
  });

  it('turning basic off also turns advanced off in the same request', () => {
    render(<TenantCapabilitiesPanel tenant={stockTenant(true, true)} />);
    expect(screen.getByLabelText(/Stock avanzado/)).toBeChecked();
    fireEvent.click(screen.getByLabelText(/Stock básico/));
    expect(screen.getByLabelText(/Stock avanzado/)).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar capacidades' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));
    expect(mocks.mutate.mock.calls[0][0].input).toMatchObject({ usesInventoryBasic: false, usesInventoryAdvanced: false });
  });
});
