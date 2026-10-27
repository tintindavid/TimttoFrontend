/** Derived tenant type (never stored): computed from the two capability flags. */
export type TenantType = 'provider' | 'client' | 'hybrid';

/**
 * Capability keys a UI element or route can require. `registersExternal` is also the premium module
 * "Servicios de terceros" (external activities and services), `usesQrs` the premium module "QRs y tickets" and
 * `usesInventoryBasic` / `usesInventoryAdvanced` the premium Stock levels (advanced needs basic) and
 * `scheduleQuickLoad` the premium switch "Carga rápida desde el cronograma" (needs `registersExternal`).
 */
export type TenantCapability =
  | 'executesServices'
  | 'managesCustomers'
  | 'registersExternal'
  | 'usesQrs'
  | 'scheduleQuickLoad'
  | 'usesInventoryBasic'
  | 'usesInventoryAdvanced'
  | 'usesRequisiciones';

/** Response of GET /my-tenant/capabilities. */
export interface TenantCapabilities {
  executesServices: boolean;
  /**
   * Premium module "Gestiona clientes" (requires executesServices). OFF with executesServices ON is "mantenimiento
   * propio": the tenant works only with its organization customer, so every client selector/filter is hidden.
   * Absent in an old backend response: read it as `executesServices` (legacy compatibility).
   */
  managesCustomers: boolean;
  registersExternal: boolean;
  /** Premium module "QRs y tickets". Absent in an old backend response: read it as false when the rest is present. */
  usesQrs: boolean;
  /** Premium switch "Carga rápida desde el cronograma": effective value (true only with registersExternal). */
  scheduleQuickLoad: boolean;
  /** Premium Stock catalog (nombre + tipo). Absent in an old backend response: read it as false. */
  usesInventoryBasic: boolean;
  /** Premium Stock with quantities and movements (needs usesInventoryBasic). */
  usesInventoryAdvanced: boolean;
  /** Premium module "Requisiciones" (independent of the other flags). Absent in an old backend response: read it as false. */
  usesRequisiciones: boolean;
  type: TenantType;
  organizationCustomerId: string | null;
}

/** Everything enabled: used while loading, on errors and for the superadmin outside view-as. */
export const ALL_CAPABILITIES_ENABLED: TenantCapabilities = {
  executesServices: true,
  managesCustomers: true,
  registersExternal: true,
  usesQrs: true,
  scheduleQuickLoad: true,
  usesInventoryBasic: true,
  usesInventoryAdvanced: true,
  usesRequisiciones: true,
  type: 'hybrid',
  organizationCustomerId: null,
};

/** Flags + preset payload accepted by PATCH /platform/tenants/:id/capabilities. */
export interface UpdateTenantCapabilitiesInput {
  executesServices?: boolean;
  managesCustomers?: boolean;
  registersExternal?: boolean;
  usesQrs?: boolean;
  scheduleQuickLoad?: boolean;
  usesInventoryBasic?: boolean;
  usesInventoryAdvanced?: boolean;
  usesRequisiciones?: boolean;
  type?: TenantType;
  organizationCustomerId?: string;
}

/** Candidate organization client returned with the 409 ORGANIZATION_CUSTOMER_REQUIRED. */
export interface OrganizationCustomerCandidate {
  _id: string;
  Razonsocial?: string;
  Nit?: number | string;
}

/** Derives the tenant type from the flags (mirrors the backend helper). */
export const getTenantType = (flags: {
  executesServices: boolean;
  registersExternal: boolean;
}): TenantType => {
  if (flags.executesServices && flags.registersExternal) return 'hybrid';
  return flags.executesServices ? 'provider' : 'client';
};

/** Presets shown in the platform console. */
export const TENANT_TYPE_PRESETS: Record<
  TenantType,
  { label: string; description: string; executesServices: boolean; registersExternal: boolean }
> = {
  provider: {
    label: 'Prestador',
    description: 'Ejecuta servicios de mantenimiento para sus clientes.',
    executesServices: true,
    registersExternal: false,
  },
  client: {
    label: 'Cliente',
    description: 'Gestiona sus equipos y registra el mantenimiento realizado por terceros.',
    executesServices: false,
    registersExternal: true,
  },
  hybrid: {
    label: 'Mixto',
    description: 'Ejecuta servicios propios y además registra mantenimiento de terceros.',
    executesServices: true,
    registersExternal: true,
  },
};
