import { useQuery } from '@tanstack/react-query';
import { getActividadesExternas } from '@/services/cronograma.service';
import type { ActividadesExternasParams } from '@/types/cronograma.types';

/**
 * Scheduled external activities for the unified schedule.
 * `enabled` lets the "Por Cliente" tab wait until a client is chosen.
 */
export const useCronogramaActividadesExternas = (
  params: ActividadesExternasParams,
  options: { enabled?: boolean } = {},
) =>
  useQuery(
    // `anio` decides the executed months, so it has to be part of the key or a year change would reuse stale data
    ['cronograma-actividades-externas', params.clienteId ?? null, params.mes ?? null, params.tipo ?? null, params.anio ?? null],
    () => getActividadesExternas(params),
    {
      enabled: options.enabled ?? true,
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    },
  );

export default useCronogramaActividadesExternas;
