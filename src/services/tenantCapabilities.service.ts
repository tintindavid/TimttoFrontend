import { api } from './api';
import type { TenantCapabilities } from '@/types';

/** Reads the capabilities of the effective tenant (own tenant or view-as tenant). */
export class TenantCapabilitiesService {
  static async getMine(): Promise<TenantCapabilities> {
    const response = await api.get('/my-tenant/capabilities');
    return response.data.data;
  }
}
