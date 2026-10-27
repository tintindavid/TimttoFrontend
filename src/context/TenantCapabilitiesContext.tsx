import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGetTenantCapabilities } from '@/hooks/useTenantCapabilities';
import {
  ALL_CAPABILITIES_ENABLED,
  type TenantCapabilities,
  type TenantCapability,
} from '@/types';

export interface TenantCapabilitiesContextValue extends TenantCapabilities {
  /** True while the first fetch is in flight (capabilities default to enabled meanwhile). */
  isLoading: boolean;
  can: (capability: TenantCapability) => boolean;
}

const buildValue = (caps: TenantCapabilities, isLoading: boolean): TenantCapabilitiesContextValue => ({
  ...caps,
  isLoading,
  can: (capability) => caps[capability],
});

// Default (no provider mounted): everything enabled, so isolated component tests and
// old backends behave exactly as before this feature.
const TenantCapabilitiesContext = createContext<TenantCapabilitiesContextValue>(
  buildValue(ALL_CAPABILITIES_ENABLED, false)
);

export const TenantCapabilitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, tenantId, viewAsTenantId } = useAuth();
  const effectiveTenantId = viewAsTenantId || tenantId;
  // On a page reload the token is read synchronously but the user arrives later: until then the capabilities are
  // still "loading" (otherwise a deep link to a paid module would be redirected before the fetch even starts).
  const authPending = !!token && !user;
  // A superadmin outside view-as works at platform level: everything is enabled.
  const isPlatformView = user?.role === 'superadmin' && !viewAsTenantId;

  const { data, isLoading } = useGetTenantCapabilities(
    effectiveTenantId,
    !!user && !isPlatformView
  );

  const value = useMemo(
    () =>
      isPlatformView
        ? buildValue(ALL_CAPABILITIES_ENABLED, false)
        : !data
          // Loading or failed: modules default to enabled so nothing flickers away, EXCEPT the paid quick load, the
          // Stock levels and Requisiciones, which must not be offered to a tenant that may not have them.
          ? buildValue(
              {
                ...ALL_CAPABILITIES_ENABLED,
                scheduleQuickLoad: false,
                usesInventoryBasic: false,
                usesInventoryAdvanced: false,
                usesRequisiciones: false,
              },
              authPending || (!!user && isLoading)
            )
          // Old backend responses lack the inventory flags: read them as off.
          : buildValue(
              {
                ...data,
                // Legacy backend without the flag: it behaves as `executesServices`. It always needs executesServices.
                managesCustomers: !!data.executesServices && (data.managesCustomers ?? data.executesServices),
                usesInventoryBasic: !!data.usesInventoryBasic,
                usesInventoryAdvanced: !!data.usesInventoryBasic && !!data.usesInventoryAdvanced,
                usesRequisiciones: !!data.usesRequisiciones,
              },
              false
            ),
    [isPlatformView, data, user, isLoading, authPending]
  );

  return <TenantCapabilitiesContext.Provider value={value}>{children}</TenantCapabilitiesContext.Provider>;
};

export const useTenantCapabilities = (): TenantCapabilitiesContextValue =>
  useContext(TenantCapabilitiesContext);
