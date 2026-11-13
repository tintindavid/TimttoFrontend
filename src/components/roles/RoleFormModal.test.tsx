import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoleFormModal from './RoleFormModal';
import { TenantCapabilitiesProvider } from '@/context/TenantCapabilitiesContext';
import * as capsHook from '@/hooks/useTenantCapabilities';
import * as authCtx from '@/context/AuthContext';

const catalog = {
  flat: {},
  grouped: {
    ots: ['ots:read', 'ots:create'],
    requisiciones: ['requisiciones:read', 'requisiciones:create'],
    areas: ['areas:read'],
    tickets: ['tickets:read'],
    customers: ['customers:read'],
  },
} as never;

function renderModal(capabilities: Record<string, boolean>, onSubmit = vi.fn(), role?: never) {
  vi.spyOn(authCtx, 'useAuth').mockReturnValue({
    user: { role: 'admin' }, token: 't', tenantId: 'acme', viewAsTenantId: null,
  } as never);
  vi.spyOn(capsHook, 'useGetTenantCapabilities').mockReturnValue({ data: capabilities, isLoading: false } as never);
  return render(
    <TenantCapabilitiesProvider>
      <RoleFormModal show onHide={() => {}} onSubmit={onSubmit} permissions={catalog} role={role} />
    </TenantCapabilitiesProvider>
  );
}

const base = {
  executesServices: true, registersExternal: false, usesQrs: false, scheduleQuickLoad: false,
  usesInventoryBasic: false, usesInventoryAdvanced: false, usesRequisiciones: false, managesCustomers: false,
};

describe('RoleFormModal — permissions by tenant capability', () => {
  it('hides permissions of modules the tenant has not enabled', () => {
    renderModal(base);
    expect(screen.getByText('Órdenes de Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Terceros')).toBeInTheDocument();
    expect(screen.queryByText('Requisiciones')).not.toBeInTheDocument();
    expect(screen.queryByText('Áreas')).not.toBeInTheDocument();
    expect(screen.queryByText('Tickets')).not.toBeInTheDocument();
  });

  it('shows them when the module is enabled', () => {
    renderModal({ ...base, usesRequisiciones: true, usesQrs: true });
    expect(screen.getByText('Requisiciones')).toBeInTheDocument();
    expect(screen.getByText('Tickets')).toBeInTheDocument();
  });

  it('keeps hidden permissions already granted to the role when saving', async () => {
    const onSubmit = vi.fn();
    renderModal(base, onSubmit, { _id: 'r1', name: 'Rol', description: '', isDefault: false, permissions: ['ots:read', 'requisiciones:read'] } as never);
    fireEvent.click(await screen.findByRole('button', { name: /guardar|actualizar|crear/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].permissions.sort()).toEqual(['ots:read', 'requisiciones:read']);
  });
});
