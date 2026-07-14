export interface Role {
  _id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isDefault?: boolean;
  isSystem?: boolean;
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

/**
 * Response shape of GET /api/v1/permissions.
 *  - flat: { USERS_READ: 'users:read', ... } — SNAKE_CASE key → permission string
 *  - grouped: { users: ['users:read', 'users:create', ...] } — resource → permission strings
 */
export interface PermissionsCatalog {
  flat: Record<string, string>;
  grouped: Record<string, string[]>;
}