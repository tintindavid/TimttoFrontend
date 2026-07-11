import type { PaginationInfo } from './api.types';
import type { UserRole } from './user.types';

export interface PlatformUser {
  _id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role: UserRole;
  mustChangePassword?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformUsersListParams {
  tenantId?: string;
  role?: UserRole | '';
  email?: string;
  page?: number;
  limit?: number;
}

export interface PlatformUsersPaginatedResponse {
  data: PlatformUser[];
  pagination: PaginationInfo;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  /** True when the backend successfully dispatched the credentials email (E3) */
  emailSent?: boolean;
}
