import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { NotificationPreference, UpsertNotificationPreferenceDto } from '@/types/notification.types';

/**
 * Self-service preferences. GET lists only the caller's own preferences (server
 * derives userId from the JWT); PUT upserts by `event` — no per-record CRUD, so
 * this wraps `api` directly instead of extending BaseService.
 */
class NotificationPreferenceService {
  private endpoint = '/notification-preferences';

  async list(): Promise<ApiResponse<NotificationPreference[]>> {
    const response = await api.get<ApiResponse<NotificationPreference[]>>(this.endpoint);
    return response.data;
  }

  async upsert(data: UpsertNotificationPreferenceDto): Promise<ApiResponse<NotificationPreference>> {
    const response = await api.put<ApiResponse<NotificationPreference>>(this.endpoint, data);
    return response.data;
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
export default notificationPreferenceService;
