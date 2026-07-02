import { api } from './api';
import type { PlatformAuditListParams, PlatformAuditPaginatedResponse } from '@/types';

export class PlatformAuditService {
  static async list(params?: PlatformAuditListParams): Promise<PlatformAuditPaginatedResponse> {
    const response = await api.get('/platform/audit-log', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }
}
