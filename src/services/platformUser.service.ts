import { api } from './api';
import type {
  PlatformUsersListParams,
  PlatformUsersPaginatedResponse,
  ResetPasswordResponse,
} from '@/types';

export class PlatformUserService {
  static async list(params?: PlatformUsersListParams): Promise<PlatformUsersPaginatedResponse> {
    const response = await api.get('/platform/users', { params });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Resets the cross-tenant user password. Returns temporaryPassword once.
   */
  static async resetPassword(userId: string): Promise<ResetPasswordResponse> {
    const response = await api.post(`/platform/users/${userId}/reset-password`);
    return response.data.data;
  }
}
