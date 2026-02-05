import { api } from '@/services/api';
import { ActividadMtto, CreateActividadDto, UpdateActividadDto } from '@/types/actividad.types';
import { ApiResponse } from '@/types/api.types';

const base = '/actividad-mtto';

const actividadService = {
  create: async (payload: CreateActividadDto): Promise<ApiResponse<ActividadMtto>> => {
    const res = await api.post<ApiResponse<ActividadMtto>>(base, payload);
    return res.data;
  },

  getAll: async (params?: any): Promise<ApiResponse<ActividadMtto[]>> => {
    const res = await api.get<ApiResponse<ActividadMtto[]>>(base, { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<ActividadMtto>> => {
    const res = await api.get<ApiResponse<ActividadMtto>>(`${base}/${id}`);
    return res.data;
  },

  update: async (id: string, payload: UpdateActividadDto): Promise<ApiResponse<ActividadMtto>> => {
    const res = await api.put<ApiResponse<ActividadMtto>>(`${base}/${id}`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<ApiResponse<null>> => {
    const res = await api.delete<ApiResponse<null>>(`${base}/${id}`);
    return res.data;
  },
};

export { actividadService };
export default actividadService;
