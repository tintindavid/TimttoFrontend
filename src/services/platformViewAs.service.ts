import { api } from './api';

export interface ViewAsEnterResponse {
  tenant: {
    tenantId: string;
    name: string;
  };
}

export class PlatformViewAsService {
  /**
   * Registers view-as entry in the audit log. Returns target tenant info.
   * Body: { tenantId }
   */
  static async enter(tenantId: string): Promise<ViewAsEnterResponse> {
    const response = await api.post('/platform/view-as', { tenantId });
    return response.data.data;
  }

  /**
   * Registers view-as exit in the audit log.
   */
  static async exit(): Promise<void> {
    await api.delete('/platform/view-as');
  }
}
