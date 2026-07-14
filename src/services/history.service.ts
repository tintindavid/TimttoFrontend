import { api } from './api';
import { ApiResponse } from '@/types/api.types';

export interface HistoryEntry {
  _id: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  description: string;
  userId?: string | null;
  userName?: string | null;
  changes?: Record<string, { from?: unknown; to?: unknown }> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Reads the activity timeline for a given resource. The backend enforces
 * tenant scoping, so passing only resourceType + resourceId is safe.
 */
export const historyService = {
  async listByResource(
    resourceType: string,
    resourceId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ data: HistoryEntry[]; pagination: Pagination }> {
    const response = await api.get<ApiResponse<HistoryEntry[]>>('/history', {
      params: {
        resourceType,
        resourceId,
        page: options.page,
        limit: options.limit,
      },
    });
    return {
      data: response.data.data || [],
      pagination: (response.data.pagination as Pagination) || {
        page: 1,
        limit: options.limit || 100,
        total: 0,
        pages: 0,
      },
    };
  },
};
