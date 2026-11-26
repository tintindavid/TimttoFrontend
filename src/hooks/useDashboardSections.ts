import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardFilters, DashboardSeccion } from '@/types/dashboard.types';

export const DASHBOARD_STALE_TIME_MS = 60_000;

/**
 * One query per dashboard card, so a failing card does not take the others down.
 * The key carries the section and every filter: changing a filter refetches.
 * `enabled` is false for superadmin platform view (no tenant) and for hidden cards.
 */
const useSection = <T>(
  seccion: DashboardSeccion,
  filters: DashboardFilters,
  fetcher: (f: DashboardFilters) => Promise<T>,
  enabled: boolean
) => {
  const { tenantId, viewAsTenantId } = useAuth();
  const tenantEfectivo = viewAsTenantId ?? tenantId;
  return useQuery<T>(['dashboard', tenantEfectivo, seccion, filters], () => fetcher(filters), {
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
    retry: false,
  });
};

export const useDashboardCumplimiento = (f: DashboardFilters, enabled = true) =>
  useSection('cumplimiento', f, dashboardService.getCumplimiento, enabled);
export const useDashboardEquiposPeriodo = (f: DashboardFilters, enabled = true) =>
  useSection('equipos-periodo', f, dashboardService.getEquiposPeriodo, enabled);
export const useDashboardMisCifras = (f: DashboardFilters, enabled = true) =>
  useSection('mis-cifras', f, dashboardService.getMisCifras, enabled);
export const useDashboardRanking = (f: DashboardFilters, enabled = true) =>
  useSection('ranking', f, dashboardService.getRanking, enabled);
export const useDashboardItems = (f: DashboardFilters, enabled = true) =>
  useSection('items', f, dashboardService.getItems, enabled);
export const useDashboardTiempos = (f: DashboardFilters, enabled = true) =>
  useSection('tiempos', f, dashboardService.getTiempos, enabled);
export const useDashboardOperativos = (f: DashboardFilters, enabled = true) =>
  useSection('operativos', f, dashboardService.getOperativos, enabled);
export const useDashboardAlertas = (f: DashboardFilters, enabled = true) =>
  useSection('alertas', f, dashboardService.getAlertas, enabled);
