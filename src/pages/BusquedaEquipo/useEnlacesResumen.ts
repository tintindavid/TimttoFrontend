import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useHasPermission } from '@/hooks/usePermission';
import type { ResumenEquipo } from '@/types/busquedaEquipo.types';

export interface EnlacesResumen {
  cliente: string | null;
  cronograma: string | null;
  /** Resume sheet: the summary is read-only, so it is offered only once the sheet exists. */
  hojaVida: string | null;
  /** A tab of the resume sheet page, only once the sheet exists. */
  pestanaHojaVida: (tab: string) => string | null;
  actividadesExternas: string | null;
  ot: (otId: string) => string | null;
  ticket: (ticketId: string) => string | null;
}

/** A link is only offered when the router (and the user's permissions) let the user open its target. */
export const useEnlacesResumen = (resumen: ResumenEquipo): EnlacesResumen => {
  const { user } = useAuth();
  const { can, isLoading } = useTenantCapabilities();
  const puedeVerClientes = useHasPermission(PERMISSIONS.CUSTOMERS_READ);
  const puedeVerOts = useHasPermission(PERMISSIONS.OTS_READ);

  const { equipo, cliente, hojaVida, actividadesExternas } = resumen;
  // While loading, capabilities default to enabled: premium links wait for the real answer.
  const conModulo = (capacidad: 'executesServices' | 'usesQrs' | 'registersExternal') => !isLoading && can(capacidad);
  const rutaHv = `/hv-equipo/${equipo._id}`;

  return {
    cliente: cliente && puedeVerClientes ? `/terceros/${cliente._id}` : null,
    cronograma: cliente ? `/cronogramas?cliente=${cliente._id}` : null,
    hojaVida: hojaVida.disponible && hojaVida.existe ? rutaHv : null,
    pestanaHojaVida: (tab) => (hojaVida.disponible && hojaVida.existe ? `${rutaHv}?tab=${tab}` : null),
    // The tab is empty on the resume sheet page while the sheet does not exist.
    actividadesExternas:
      actividadesExternas.disponible && conModulo('registersExternal') && hojaVida.disponible && hojaVida.existe
        ? `${rutaHv}?tab=actividades-externas`
        : null,
    ot: (otId) => (puedeVerOts && conModulo('executesServices') ? `/ots/${otId}` : null),
    // The ticket panel routes are restricted to the admin role.
    ticket: (ticketId) => (user?.role === 'admin' && conModulo('usesQrs') ? `/tickets/${ticketId}` : null),
  };
};
