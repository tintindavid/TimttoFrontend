import { BaseService } from './base.service';
import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { Role, CreateRoleDto, UpdateRoleDto, PermissionsCatalog } from '@/types/role.types';

class RoleService extends BaseService<Role, CreateRoleDto, UpdateRoleDto> {
  constructor() {
    super('/roles');
  }

  async getPermissions(): Promise<ApiResponse<PermissionsCatalog>> {
    const response = await api.get<ApiResponse<PermissionsCatalog>>('/permissions');
    return response.data;
  }
}

export const roleService = new RoleService();