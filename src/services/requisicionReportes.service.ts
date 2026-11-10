import { api } from './api';
import { rethrowDecodingBlobError } from '@/utils/saveBlob';
import { ApiResponse } from '@/types/api.types';
import { REQUISICION_QUERY_KEYS, type RequisicionQueryParams } from '@/types/requisicion.types';
import type { Metricas, MetricasFiltros, Tablero } from '@/types/requisicionReportes.types';

export type ExportFormato = 'pdf' | 'xlsx';

/** A downloaded file: the blob plus the server-provided name (empty when the header is missing). */
export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

/** Extracts the filename of a Content-Disposition header (RFC 5987 `filename*` first, then plain `filename`). */
export const parseContentDispositionFilename = (header?: string | null): string => {
  if (!header) return '';
  const star = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // fall through to the plain filename
    }
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(header);
  if (!plain) return '';
  return (plain[2] ?? plain[1]).trim();
};

const getFile = async (url: string, params?: Record<string, unknown>): Promise<ArchivoDescargado> => {
  const response = await api.get<Blob>(url, { params, responseType: 'blob', timeout: 60000 }).catch(rethrowDecodingBlobError);
  const headers = response.headers as Record<string, string | undefined> | undefined;
  return {
    blob: response.data,
    filename: parseContentDispositionFilename(headers?.['content-disposition']),
  };
};

/** Reporting and export endpoints (epic E5). Downloads are generated on demand; the caller saves the blob. */
export const requisicionReportesService = {
  getTablero: async () => {
    const response = await api.get<ApiResponse<Tablero>>('/requisiciones/tablero');
    return response.data;
  },

  getMetricas: async (filtros: MetricasFiltros = {}) => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value !== undefined && value !== ''));
    const response = await api.get<ApiResponse<Metricas>>('/requisiciones/metricas', { params, timeout: 30000 });
    return response.data;
  },

  exportarRequisicion: (id: string, formato: ExportFormato) => getFile(`/requisiciones/${id}/export/${formato}`),

  exportarComparativo: (id: string, formato: ExportFormato) =>
    getFile(`/requisiciones/${id}/licitacion/comparativo/export`, { formato }),

  /** Same filters as the list (only the contract's keys; pagination and sorting are not part of an export). */
  exportarListado: (params: RequisicionQueryParams = {}) => {
    const allowed = new Set<string>(REQUISICION_QUERY_KEYS);
    const skip = new Set(['page', 'limit']);
    const clean = Object.fromEntries(
      Object.entries(params).filter(
        ([key, value]) => allowed.has(key) && !skip.has(key) && value !== undefined && value !== ''
      )
    );
    return getFile('/requisiciones/export/xlsx', clean);
  },
};
