import type { PaginationInfo } from './api.types';
import type { TenantCapabilities, TenantType } from './tenantCapabilities.types';

// Status values for a platform-managed tenant
export type TenantStatus = 'active' | 'suspended' | 'closed';

// Full tenant shape returned by the platform endpoints
export interface PlatformTenant {
  _id: string;
  tenantId: string;
  name: string;
  slogan?: string;
  nit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  website?: string;
  logoUrl?: string;
  ownerId?: string;
  plan?: string;
  /** Absent on tenants created before E5: treated as provider. */
  capabilities?: { executesServices: boolean; managesCustomers?: boolean; registersExternal: boolean; usesQrs?: boolean; scheduleQuickLoad?: boolean; usesInventoryBasic?: boolean; usesInventoryAdvanced?: boolean; usesRequisiciones?: boolean };
  organizationCustomerId?: string | null;
  status: TenantStatus;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Computed counters returned alongside the tenant in the detail endpoint
export interface TenantCounters {
  usersCount: number;
  customersCount: number;
  equiposCount: number;
  otsAbiertas: number;
}

// Shape of the detail endpoint response: { tenant, counters }
export interface PlatformTenantDetail {
  tenant: PlatformTenant;
  counters: TenantCounters;
}

// Input for the transactional create (wizard step 1 + 2 + optional logo)
export interface CreateTenantWithAdminInput {
  tenant: {
    tenantId: string;
    name: string;
    slogan?: string;
    direccion?: string;
    email?: string;
    telefono?: string;
    nit?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
    website?: string;
  };
  admin: {
    email: string;
    firstName: string;
    lastName: string;
  };
  logoFile?: File;
  /** Preset sent next to tenant/admin. Omitted (backend default provider) for provider tenants. */
  type?: TenantType;
  /** Explicit flags (alternative to `type`; never both). Used for tenants that execute services. */
  capabilities?: { executesServices?: boolean; registersExternal?: boolean; managesCustomers?: boolean };
}

// Slim admin shape returned inside the create response
export interface CreatedAdminInfo {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

/** Seeding summary returned when the requisitions module was just activated (counts of created records). */
export type RequisicionesDefaultsResult =
  | { tipos: number; areas: number; regla: number; presupuesto: number; error?: undefined }
  | { error: true };

// One-time create response — temporaryPassword never returned again
export interface CreateTenantWithAdminResponse {
  tenant: PlatformTenant;
  admin: CreatedAdminInfo;
  temporaryPassword: string;
  /** True when the backend successfully dispatched the credentials email (E3) */
  emailSent?: boolean;
  requisicionesDefaults?: RequisicionesDefaultsResult;
}

// Payload for the suspend endpoint
export interface SuspendTenantInput {
  reason: string;
}

// Editable metadata fields (protected fields: tenantId, status, plan, ownerId)
export interface UpdateTenantMetadataInput {
  name?: string;
  slogan?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  nit?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  website?: string;
}

// Query params for the list endpoint
export interface PlatformTenantsListParams {
  page?: number;
  limit?: number;
  status?: TenantStatus | '';
  plan?: string;
  search?: string;
  includeDeleted?: boolean;
}

// Paginated list response (mirrors api.types PaginationInfo)
export interface PlatformTenantsPaginatedResponse {
  data: PlatformTenant[];
  pagination: PaginationInfo;
}

// Accumulated form data across the 4 wizard steps
export interface WizardFormData {
  type: TenantType;
  tenant: CreateTenantWithAdminInput['tenant'];
  admin: CreateTenantWithAdminInput['admin'];
  logoFile?: File;
}

/** PATCH /platform/tenants/:id/capabilities response: capabilities plus the seeding summary when attempted. */
export type UpdateTenantCapabilitiesResponse = TenantCapabilities & {
  requisicionesDefaults?: RequisicionesDefaultsResult;
};
