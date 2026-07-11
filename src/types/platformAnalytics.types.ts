// Platform Analytics types — E4 SaaS Evolution

export interface AnalyticsFilters {
  from?: string; // ISO date YYYY-MM-DD
  to?: string;   // ISO date YYYY-MM-DD
  includeDeleted?: boolean;
}

export interface TenantStats {
  total: number;
  active: number;
  suspended: number;
  closed: number;
}

export interface UserStats {
  total: number;
  admin: number;
  technician: number;
  user: number;
  superadmin: number;
}

export interface OtStats {
  open: number;
  closed: number;
  cancelled: number;
  byType: Record<string, number>;
}

export interface OtsPerTenantRow {
  tenantId: string;
  tenantName: string;
  count: number;
}

export interface EquiposTimelineRow {
  month: string; // 'YYYY-MM'
  count: number;
}

export interface AnalyticsSummary {
  tenantStats: TenantStats;
  userStats: UserStats;
  equipoTotal: number;
  otStats: OtStats;
  otsPerTenant: OtsPerTenantRow[];
  equiposTimeline: EquiposTimelineRow[];
}

export interface TenantBreakdownRow {
  tenantId: string;
  tenantName: string;
  status: 'active' | 'suspended' | 'closed';
  plan: string;
  createdAt: string;
  usersCount: number;
  equiposCount: number;
  otsOpen: number;
  otsClosed: number;
  reportsCount: number;
}
