import type { DemoLimits } from './platformTenant.types';

export interface DemoUsage {
  users: number;
  customers: number;
  equipos: number;
}

export type DemoStatus = { enabled: false } | { enabled: true; limits: DemoLimits; usage: DemoUsage };
