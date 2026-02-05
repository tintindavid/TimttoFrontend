import { api } from '@/services/api';
import { Tenant, CreateTenantDto, UpdateTenantDto } from '@/types/tenant.types';

const base = '/tenants';

const tenantService = {
  getAll: async (params?: any) => {
    const res = await api.get<{ success: boolean; data: Tenant[] }>(base, { params });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Tenant }>(`${base}/${id}`);
    return res.data;
  },

  create: async (payload: CreateTenantDto) => {
    const res = await api.post<{ success: boolean; data: Tenant }>(base, payload);
    return res.data;
  },

  update: async (id: string, payload: UpdateTenantDto) => {
    const res = await api.put<{ success: boolean; data: Tenant }>(`${base}/${id}`, payload);
    return res.data;
  },

  remove: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: null }>(`${base}/${id}`);
    return res.data;
  },
};

export { tenantService };
export default tenantService;
