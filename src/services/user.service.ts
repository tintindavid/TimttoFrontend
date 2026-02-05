import { BaseService } from './base.service';
import { api } from './api';
import { User, CreateUserDto, UpdateUserDto, UpdateProfileDto } from '@/types/user.types';

class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super('/users');
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const response = await api.post(`/users/${id}/change-password`, { oldPassword, newPassword });
    return response.data;
  }

  async resetPassword(id: string) {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  async updateSignature(id: string, signatureData: string) {
    const response = await api.put(`/users/${id}`, { fileFirma: signatureData });
    return response.data;
  }
}

export const userService = new UserService();
