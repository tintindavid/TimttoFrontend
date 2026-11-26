import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { BusquedaEquipoService } from '@/services/busquedaEquipo.service';
import type { EquipoEncontrado, ResumenEquipo } from '@/types/busquedaEquipo.types';

export const MIN_CARACTERES_BUSQUEDA = 2;
export const MAX_CARACTERES_BUSQUEDA = 60;

/** The backend ignores separators, so only the remaining characters count towards the minimum. */
export const esTerminoValido = (termino: string): boolean =>
  termino.replace(/[\s\-_./]/g, '').length >= MIN_CARACTERES_BUSQUEDA;

/** Tenant the requests run against (view-as wins); null at platform level, where there is nothing to search. */
export const useTenantEfectivo = (): string | null => {
  const { tenantId, viewAsTenantId } = useAuth();
  const efectivo = viewAsTenantId ?? tenantId;
  return efectivo && efectivo !== '__platform__' ? efectivo : null;
};

export const useBuscarEquipos = (termino: string) => {
  const tenantId = useTenantEfectivo();
  const q = termino.trim();
  return useQuery<EquipoEncontrado[]>(
    ['busqueda-equipos', tenantId, q],
    ({ signal }) => BusquedaEquipoService.buscar(q, signal),
    { enabled: !!tenantId && esTerminoValido(q), staleTime: 30_000, retry: false }
  );
};

export const useResumenEquipo = (equipoId: string) => {
  const tenantId = useTenantEfectivo();
  return useQuery<ResumenEquipo>(
    ['resumen-equipo', tenantId, equipoId],
    () => BusquedaEquipoService.getResumen(equipoId),
    // Always refetch on entry: the summary must reflect reports or tickets just created elsewhere.
    { enabled: !!tenantId && !!equipoId, retry: false, refetchOnMount: 'always' }
  );
};
