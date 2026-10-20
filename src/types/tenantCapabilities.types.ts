/** Derived tenant type (never stored): computed from the two capability flags. */
export type TenantType = 'provider' | 'client' | 'hybrid';

/** Capability keys a UI element or route can require. */
export type TenantCapability = 'executesServices' | 'registersExternal';

/** Response of GET /my-tenant/capabilities. */
export interface TenantCapabilities {
  executesServices: boolean;
  registersExternal: boolean;
  type: TenantType;
  organizationCustomerId: string | null;
}

/** Everything enabled: used while loading, on errors and for the superadmin outside view-as. */
export const ALL_CAPABILITIES_ENABLED: TenantCapabilities = {
  executesServices: true,
  registersExternal: true,
  type: 'hybrid',
  organizationCustomerId: null,
};

/** Flags + preset payload accepted by PATCH /platform/tenants/:id/capabilities. */
export interface UpdateTenantCapabilitiesInput {
  executesServices?: boolean;
  registersExternal?: boolean;
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
