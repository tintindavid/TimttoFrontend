export interface Role {
  _id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
}

export type UpdateRoleDto = Partial<CreateRoleDto>;
export type PermissionsCatalog = Record<string, string>;