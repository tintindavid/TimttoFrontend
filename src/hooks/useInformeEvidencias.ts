import { useInfiniteQuery } from '@tanstack/react-query';

import { informeService } from '@/services/informe.service';
import { EvidenciasListResponse } from '@/types/informe.types';

export const EVIDENCIAS_PAGE_SIZE = 24;

interface Params {
  clienteId: string;
  otIds: string[];
  reporteId?: string;
  search?: string;
  enabled: boolean;
}

/** Paged candidate photos for the by-OT informe ("Ver más" = fetchNextPage). */
export function useInformeEvidencias({ clienteId, otIds, reporteId, search, enabled }: Params) {
  const tenantId = localStorage.getItem('tenantId');
  return useInfiniteQuery<EvidenciasListResponse>({
    queryKey: ['informe-evidencias', tenantId, clienteId, otIds, reporteId ?? '', search ?? ''],
    queryFn: ({ pageParam = 1 }) =>
      informeService.listEvidenciasByOt({
        clienteId,
        otIds,
        reporteId: reporteId || undefined,
        search: search || undefined,
        page: pageParam,
        limit: EVIDENCIAS_PAGE_SIZE,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: enabled && !!clienteId && otIds.length > 0,
    keepPreviousData: true,
  });
}
