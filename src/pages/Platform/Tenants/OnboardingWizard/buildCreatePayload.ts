import type { CreateTenantWithAdminInput, WizardFormData } from '@/types';

/** Create request of the onboarding wizard. */
export function buildCreatePayload(formData: WizardFormData): CreateTenantWithAdminInput {
  const { type, isDemo, ...rest } = formData;
  // Demo accounts carry no preset: the backend enables every module and applies the demo limits.
  if (isDemo) return { ...rest, tenant: { ...rest.tenant, isDemo: true } };
  // A client organization does not execute services: it travels as a preset. Tenants that execute services keep
  // managing customers (previous behavior), so they travel as explicit flags (the backend accepts `type` OR
  // `capabilities`, never both); the superadmin can turn "Gestiona clientes" off later for "own maintenance".
  if (type === 'client') return { ...rest, type };
  return {
    ...rest,
    capabilities: {
      executesServices: true,
      registersExternal: type === 'hybrid',
      managesCustomers: true,
    },
  };
}
