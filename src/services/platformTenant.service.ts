import { api } from './api';
import type {
  PlatformTenantDetail,
  PlatformTenantsPaginatedResponse,
  PlatformTenantsListParams,
  CreateTenantWithAdminInput,
  CreateTenantWithAdminResponse,
  SuspendTenantInput,
  UpdateTenantMetadataInput,
  PlatformTenant,
  UpdateTenantCapabilitiesInput,
  UpdateTenantCapabilitiesResponse,
  DemoSeedResult,
} from '@/types';

const DEMO_SEED_TIMEOUT_MS = 120000;

/**
 * Service for the SuperAdmin platform tenant management API.
 * All methods target /platform/tenants/* which bypass tenantId scoping on the backend.
 */
export class PlatformTenantService {
  static async list(
    params?: PlatformTenantsListParams
  ): Promise<PlatformTenantsPaginatedResponse> {
    const response = await api.get('/platform/tenants', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  static async getById(id: string): Promise<PlatformTenantDetail> {
    const response = await api.get(`/platform/tenants/${id}`);
    return response.data.data;
  }

  /**
   * Creates a tenant + first admin in a single transactional request.
   * Sends JSON when no logo is provided; multipart/form-data when logo is included.
   * The response includes temporaryPassword — shown once in the UI.
   */
  static async createWithAdmin(
    input: CreateTenantWithAdminInput
  ): Promise<CreateTenantWithAdminResponse> {
    const { logoFile, tenant, admin, type } = input;
    // A demo account loads its sample data inside the request: the default timeout would hide the one-time password.
    const config: [] | [{ timeout: number }] = tenant.isDemo ? [{ timeout: DEMO_SEED_TIMEOUT_MS }] : [];

    if (logoFile) {
      const formData = new FormData();
      formData.append('tenant', JSON.stringify(tenant));
      formData.append('admin', JSON.stringify(admin));
      if (type) formData.append('type', type);
      formData.append('logo', logoFile);
      const response = await api.post('/platform/tenants', formData, ...config);
      return response.data.data;
    }

    const response = await api.post('/platform/tenants', type ? { tenant, admin, type } : { tenant, admin }, ...config);
    return response.data.data;
  }

  /**
   * Updates editable metadata fields (name, contact, logo).
   * Protected fields (tenantId, status, plan, ownerId) are silently ignored by the backend.
   */
  static async updateMetadata(
    id: string,
    input: UpdateTenantMetadataInput,
    logoFile?: File
  ): Promise<PlatformTenant> {
    if (logoFile) {
      const formData = new FormData();
      (Object.entries(input) as [string, string | undefined][]).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });
      formData.append('logo', logoFile);
      const response = await api.put(`/platform/tenants/${id}`, formData);
      return response.data.data;
    }

    const response = await api.put(`/platform/tenants/${id}`, input);
    return response.data.data;
  }

  /**
   * Changes the capability flags (or applies a preset). Rejects with 409
   * ORGANIZATION_CUSTOMER_REQUIRED when the tenant has several clients and none was chosen.
   */
  static async updateCapabilities(
    id: string,
    input: UpdateTenantCapabilitiesInput
  ): Promise<UpdateTenantCapabilitiesResponse> {
    const response = await api.patch(`/platform/tenants/${id}/capabilities`, input);
    return response.data.data;
  }

  static async suspend(id: string, input: SuspendTenantInput): Promise<PlatformTenant> {
    const response = await api.patch(`/platform/tenants/${id}/suspend`, input);
    return response.data.data;
  }

  static async reactivate(id: string): Promise<PlatformTenant> {
    const response = await api.patch(`/platform/tenants/${id}/reactivate`);
    return response.data.data;
  }

  /** Completes the sample data of a demo account (only what is missing). */
  static async retryDemoSeed(id: string): Promise<DemoSeedResult> {
    const response = await api.post(`/platform/tenants/${id}/demo/seed`, undefined, { timeout: DEMO_SEED_TIMEOUT_MS });
    return response.data.data;
  }

  static async softDelete(id: string): Promise<void> {
    await api.delete(`/platform/tenants/${id}`);
  }
}
