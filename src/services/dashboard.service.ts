import { api } from './api';
import type { ApiResponse } from '@/types/api.types';
import type {
  DashboardAlertas,
  DashboardCumplimiento,
  DashboardEquiposPeriodo,
  DashboardFilters,
  DashboardItems,
  DashboardMisCifras,
  DashboardOperativos,
  DashboardRanking,
  DashboardSeccion,
  DashboardTiempos,
} from '@/types/dashboard.types';

/** Drops empty values so the backend only receives the filters the user actually set. */
const cleanParams = (filters: DashboardFilters): Record<string, string> => {
  const out: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() !== '') out[key] = value;
  });
  return out;
};

const fetchSection = async <T>(seccion: DashboardSeccion, filters: DashboardFilters): Promise<T> => {
  const response = await api.get<ApiResponse<T>>(`/dashboard/${seccion}`, { params: cleanParams(filters) });
  return response.data.data;
};

export const dashboardService = {
  getCumplimiento: (f: DashboardFilters) => fetchSection<DashboardCumplimiento>('cumplimiento', f),
  getEquiposPeriodo: (f: DashboardFilters) => fetchSection<DashboardEquiposPeriodo>('equipos-periodo', f),
  getMisCifras: (f: DashboardFilters) => fetchSection<DashboardMisCifras>('mis-cifras', f),
  getRanking: (f: DashboardFilters) => fetchSection<DashboardRanking>('ranking', f),
  getItems: (f: DashboardFilters) => fetchSection<DashboardItems>('items', f),
  getTiempos: (f: DashboardFilters) => fetchSection<DashboardTiempos>('tiempos', f),
  getOperativos: (f: DashboardFilters) => fetchSection<DashboardOperativos>('operativos', f),
  getAlertas: (f: DashboardFilters) => fetchSection<DashboardAlertas>('alertas', f),
};

export default dashboardService;
