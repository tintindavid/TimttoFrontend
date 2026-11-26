import { describe, it, expect, vi } from 'vitest';
import { api } from './api';
import { PlatformTenantService } from './platformTenant.service';

vi.mock('./api', () => ({ api: { post: vi.fn().mockResolvedValue({ data: { data: {} } }) } }));

const admin = { email: 'a@example.com', firstName: 'A', lastName: 'B' };

describe('creating a demo account', () => {
  it('waits for the sample data instead of using the default timeout', async () => {
    await PlatformTenantService.createWithAdmin({ tenant: { tenantId: 'demo-1', name: 'Demo', isDemo: true }, admin });
    expect(vi.mocked(api.post).mock.lastCall?.[2]).toEqual({ timeout: 120000 });
    await PlatformTenantService.retryDemoSeed('t1');
    expect(vi.mocked(api.post).mock.lastCall?.[2]).toEqual({ timeout: 120000 });
  });

  it('leaves regular tenants unchanged', async () => {
    await PlatformTenantService.createWithAdmin({ tenant: { tenantId: 'acme', name: 'Acme' }, admin });
    expect(vi.mocked(api.post).mock.lastCall).toHaveLength(2);
  });
});
