import { api } from '@/services/api';

const base = '/protocolo-actividad';

const protocoloActividadService = {
  create: async (payload: any) => {
    const res = await api.post(base, payload);
    return res.data;
  },

  getAll: async (params?: any) => {
    const res = await api.get(base, { params });
    return res.data;
  },

  remove: async (id: string) => {
    const res = await api.delete(`${base}/${id}`);
    return res.data;
  },
};

export { protocoloActividadService };
export default protocoloActividadService;
