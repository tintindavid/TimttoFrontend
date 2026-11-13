import type { TenantCapability } from '@/types';

/**
 * Tenant capability each permission resource depends on. Resources not listed
 * are available to every tenant. UI-only: the backend still enforces the
 * capability on its routes (tenantCapabilities.config.js).
 */
export const RESOURCE_CAPABILITIES: Record<string, TenantCapability[]> = {
  // Premium module "Requisiciones"
  requisiciones: ['usesRequisiciones'],
  areas: ['usesRequisiciones'],
  'approval-rules': ['usesRequisiciones'],
  budgets: ['usesRequisiciones'],
  'request-types': ['usesRequisiciones'],
  // Premium module "QRs y tickets"
  tickets: ['usesQrs'],
  'service-qrs': ['usesQrs'],
  // Premium module "Stock" (basic level opens the catalogue)
  inventario: ['usesInventoryBasic'],
  // Work orders, reports and worksheets
  ots: ['executesServices'],
  reports: ['executesServices'],
  sheetwork: ['executesServices'],
  'actividad-reporte': ['executesServices'],
  // Client portal accesses need work orders and a tenant that manages several customers
  'client-access-tokens': ['executesServices', 'managesCustomers'],
};

/** True when the tenant has every capability the permission's resource needs. */
export const isPermissionEnabledForTenant = (
  permission: string,
  can: (capability: TenantCapability) => boolean
): boolean => {
  const [resource = ''] = permission.split(':');
  const required = RESOURCE_CAPABILITIES[resource];
  return !required || required.every((capability) => can(capability));
};
