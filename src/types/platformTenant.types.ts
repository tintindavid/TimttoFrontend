import type { PaginationInfo } from './api.types';

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

// One-time create response — temporaryPassword never returned again
export interface CreateTenantWithAdminResponse {
  tenant: PlatformTenant;
  admin: CreatedAdminInfo;
  temporaryPassword: string;
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
  tenant: CreateTenantWithAdminInput['tenant'];
  admin: CreateTenantWithAdminInput['admin'];
  logoFile?: File;
}
