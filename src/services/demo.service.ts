import { api } from './api';
import type { DemoStatus } from '@/types/demo.types';

export class DemoService {
  /** Demo limits and usage of the effective tenant. */
  static async getStatus(): Promise<DemoStatus> {
    const response = await api.get('/my-tenant/demo');
    return response.data.data;
  }
}
