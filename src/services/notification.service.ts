import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { Notification, UnreadCountResponse } from '@/types/notification.types';

/**
 * Notification history + actions. Not a standard CRUD resource (read-only
 * history + action endpoints), so this wraps `api` directly instead of
 * extending BaseService.
 */
class NotificationService {
  private endpoint = '/notifications';

  async list(params?: { page?: number; limit?: number; unread?: boolean }): Promise<ApiResponse<Notification[]>> {
    const response = await api.get<ApiResponse<Notification[]>>(this.endpoint, { params });
    return response.data;
  }

  async unreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await api.get<ApiResponse<UnreadCountResponse>>(`${this.endpoint}/unread-count`);
    return response.data;
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await api.post<ApiResponse<Notification>>(`${this.endpoint}/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`${this.endpoint}/read-all`);
    return response.data;
  }

  async getEvents(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>(`${this.endpoint}/events`);
    return response.data;
  }

  async sendTest(): Promise<ApiResponse<null>> {
    const response = await api.post<ApiResponse<null>>(`${this.endpoint}/test`);
    return response.data;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
