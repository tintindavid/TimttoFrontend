import { api } from './api';
import type { AnalyticsFilters, AnalyticsSummary, TenantBreakdownRow } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Service for the SuperAdmin platform analytics API.
 * All methods target /platform/analytics/* which bypass tenantId scoping on the backend.
 */
export class PlatformAnalyticsService {
  /**
   * Fetches the global analytics summary (KPIs + chart data).
   */
  static async getSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    const response = await api.get('/platform/analytics', { params: filters });
    return response.data.data;
  }

  /**
   * Fetches the per-tenant breakdown table rows.
   */
  static async getTenants(filters?: AnalyticsFilters): Promise<TenantBreakdownRow[]> {
    const response = await api.get('/platform/analytics/tenants', { params: filters });
    return response.data.data;
  }

  /**
   * Returns the URL for downloading tenants CSV.
   * Does NOT perform any fetch — the URL is consumed by downloadCsv util.
   */
  static getTenantsCsvUrl(filters?: AnalyticsFilters): string {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.includeDeleted) params.set('includeDeleted', 'true');
    const qs = params.toString();
    return `${API_URL}/platform/analytics/tenants.csv${qs ? `?${qs}` : ''}`;
  }
}
