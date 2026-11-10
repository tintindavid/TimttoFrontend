import { useMutation, useQuery } from '@tanstack/react-query';
import { requisicionReportesService, type ExportFormato } from '@/services/requisicionReportes.service';
import type { MetricasFiltros } from '@/types/requisicionReportes.types';
import type { RequisicionQueryParams } from '@/types/requisicion.types';
import { saveBlob } from '@/utils/saveBlob';

const KEY = 'requisiciones';

/** Effective tenant (view-as wins over the own tenant), so cached reports never leak across tenants. */
const tenantKey = () => sessionStorage.getItem('viewAsTenantId') || localStorage.getItem('tenantId') || '';

/** Saves the downloaded file; falls back to `REQ-<consecutivo>.<ext>` style names when the header is missing. */
const saveDownload = (file: { blob: Blob; filename: string }, fallbackName: string) =>
  saveBlob(file.blob, file.filename || fallbackName);

export const useGetTablero = (enabled = true) =>
  useQuery({
    queryKey: [KEY, 'tablero', tenantKey()],
    queryFn: () => requisicionReportesService.getTablero(),
    enabled,
    refetchOnWindowFocus: false,
  });

export const useGetMetricas = (filtros: MetricasFiltros, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'metricas', tenantKey(), filtros],
    queryFn: () => requisicionReportesService.getMetricas(filtros),
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });

/** Read-only downloads: nothing to invalidate. Each mutation saves the file on success. */
export const useExportarRequisicion = () =>
  useMutation({
    mutationFn: async ({ id, formato, consecutivo }: { id: string; formato: ExportFormato; consecutivo?: string }) => {
      const file = await requisicionReportesService.exportarRequisicion(id, formato);
      saveDownload(file, `${consecutivo ?? 'REQ'}.${formato}`);
    },
  });

export const useExportarComparativo = () =>
  useMutation({
    mutationFn: async ({ id, formato, consecutivo }: { id: string; formato: ExportFormato; consecutivo?: string }) => {
      const file = await requisicionReportesService.exportarComparativo(id, formato);
      saveDownload(file, `${consecutivo ?? 'REQ'}-comparativo.${formato}`);
    },
  });

export const useExportarListado = () =>
  useMutation({
    mutationFn: async (params: RequisicionQueryParams) => {
      const file = await requisicionReportesService.exportarListado(params);
      saveDownload(file, 'requisiciones.xlsx');
    },
  });
