import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  getMine: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/services/tenantCapabilities.service', () => ({
  TenantCapabilitiesService: { getMine: mocks.getMine },
}));

import { TenantCapabilitiesProvider, useTenantCapabilities } from './TenantCapabilitiesContext';

const Probe: React.FC = () => {
  const c = useTenantCapabilities();
  return (
    <div>
      <span data-testid="exec">{String(c.can('executesServices'))}</span>
      <span data-testid="loading">{String(c.isLoading)}</span>
      <span data-testid="type">{c.type}</span>
      <span data-testid="quick">{String(c.can('scheduleQuickLoad'))}</span>
      <span data-testid="qrs">{String(c.can('usesQrs'))}</span>
    </div>
  );
};

const renderProvider = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
    <QueryClientProvider client={qc}>
      <TenantCapabilitiesProvider>
        <Probe />
      </TenantCapabilitiesProvider>
    </QueryClientProvider>
  );
  return { qc, ...utils };
};

const clientCaps = {
  executesServices: false,
  registersExternal: true,
  type: 'client' as const,
  organizationCustomerId: 'c1',
};

beforeEach(() => {
  mocks.useAuth.mockReset();
  mocks.getMine.mockReset();
});

describe('TenantCapabilitiesProvider', () => {
  it('defaults to enabled while loading, then applies the fetched flags', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'admin' }, tenantId: 't1', viewAsTenantId: null });
    mocks.getMine.mockResolvedValue(clientCaps);
    renderProvider();

    expect(screen.getByTestId('exec').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => expect(screen.getByTestId('exec').textContent).toBe('false'));
    expect(screen.getByTestId('type').textContent).toBe('client');
  });

  it('keeps everything enabled when the endpoint fails (old backend)', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'admin' }, tenantId: 't1', viewAsTenantId: null });
    mocks.getMine.mockRejectedValue(new Error('404'));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('exec').textContent).toBe('true');
  });

  it('keys the query by the view-as tenant', async () => {
    mocks.useAuth.mockReturnValue({
      user: { role: 'superadmin' },
      tenantId: '__platform__',
      viewAsTenantId: 't2',
    });
    mocks.getMine.mockResolvedValue(clientCaps);
    const { qc } = renderProvider();

    await waitFor(() => expect(screen.getByTestId('exec').textContent).toBe('false'));
    expect(qc.getQueryData(['tenant-capabilities', 't2'])).toEqual(clientCaps);
    expect(qc.getQueryData(['tenant-capabilities', '__platform__'])).toBeUndefined();
  });

  it('does not fetch for a superadmin outside view-as and enables everything', () => {
    mocks.useAuth.mockReturnValue({
      user: { role: 'superadmin' },
      tenantId: '__platform__',
      viewAsTenantId: null,
    });
    renderProvider();

    expect(mocks.getMine).not.toHaveBeenCalled();
    expect(screen.getByTestId('exec').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('does not fetch without a user', () => {
    mocks.useAuth.mockReturnValue({ user: null, tenantId: null, viewAsTenantId: null });
    renderProvider();
    expect(mocks.getMine).not.toHaveBeenCalled();
    expect(screen.getByTestId('exec').textContent).toBe('true');
  });
});

describe('TenantCapabilitiesProvider - the paid quick load is never assumed', () => {
  it('is off while loading, although the other modules default to enabled', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'admin' }, tenantId: 't1', viewAsTenantId: null });
    mocks.getMine.mockResolvedValue({ ...clientCaps, usesQrs: true, scheduleQuickLoad: true });
    renderProvider();
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('quick').textContent).toBe('false');
    expect(screen.getByTestId('qrs').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('quick').textContent).toBe('true'));
  });

  it('stays off when the endpoint fails', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'admin' }, tenantId: 't1', viewAsTenantId: null });
    mocks.getMine.mockRejectedValue(new Error('500'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('quick').textContent).toBe('false');
    expect(screen.getByTestId('exec').textContent).toBe('true');
  });

  it('is on for the superadmin outside view-as (platform) and follows the tenant in view-as', async () => {
    mocks.useAuth.mockReturnValue({ user: { role: 'superadmin' }, tenantId: '__platform__', viewAsTenantId: null });
    renderProvider();
    expect(screen.getByTestId('quick').textContent).toBe('true');
  });
});
