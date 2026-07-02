import type { PaginationInfo } from './api.types';

export type PlatformAuditAction =
  | 'TENANT_CREATED'
  | 'TENANT_UPDATED'
  | 'TENANT_SUSPENDED'
  | 'TENANT_REACTIVATED'
  | 'TENANT_SOFT_DELETED'
  | 'USER_PASSWORD_RESET'
  | 'VIEW_AS_ENTERED'
  | 'VIEW_AS_EXITED';

export type PlatformAuditTargetType = 'tenant' | 'user';

export interface PlatformAuditLog {
  _id: string;
  actorUserId: string;
  actorEmail: string;
  action: PlatformAuditAction;
  targetType?: PlatformAuditTargetType;
  targetId: string;
  targetTenantId?: string;
  /** Snapshot of the document before the action. Shape varies by action type. */
  before?: unknown;
  /** Snapshot of the document after the action. Shape varies by action type. */
  after?: unknown;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

export interface PlatformAuditListParams {
  actorUserId?: string;
  action?: PlatformAuditAction | '';
  targetTenantId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PlatformAuditPaginatedResponse {
  data: PlatformAuditLog[];
  pagination: PaginationInfo;
}
