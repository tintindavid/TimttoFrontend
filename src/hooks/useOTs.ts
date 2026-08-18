import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { otService } from '@/services/ot.service';
import { ApiResponse } from '@/types/api.types';
import { OT, CreateOtDto, UpdateOtDto, OtProgramacionEntry, SetOtProgramacionDto } from '@/types/ot.types';

// `params` may include `mine?: boolean` (ot-responsables-programacion-trazable)
// — the backend filters server-side by the caller's active roster; the
// frontend never filters the "Mis OTs" tab locally.
export const useOTs = (params?: any) => {
  return useQuery({
    queryKey: ['ots', params],
    queryFn: () => otService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos para OTs (más dinámico)
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

// Hook específico para OTs por cliente
export const useOTsByCustomer = (customerId: string, params?: any) => {
  return useQuery({
    queryKey: ['ots', 'customer', customerId, params],
    queryFn: () => otService.getAll({ ...params, ClienteId: customerId }),
    enabled: !!customerId,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useOT = (id: string) => {
  return useQuery(['ots', id], () => otService.getById(id), { enabled: !!id });
};

export const useCreateOt = () => {
  const qc = useQueryClient();
  return useMutation((data: CreateOtDto) => otService.create(data), {
    onSuccess: () => qc.invalidateQueries(['ots']),
  });
};

export const useUpdateOt = () => {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: UpdateOtDto }) => otService.update(id, data), {
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['ots']);
      qc.invalidateQueries(['ots', vars.id]);
    },
  });
};

export const useDeleteOt = () => {
  const qc = useQueryClient();
  return useMutation((id: string) => otService.delete(id), {
    onSuccess: () => qc.invalidateQueries(['ots']),
  });
};

/** GET /ots/:id/programaciones — full history, newest-first (ots:read). */
export const useOtProgramaciones = (otId: string | null) => {
  return useQuery({
    queryKey: ['ots', otId, 'programaciones'],
    queryFn: () => otService.getProgramaciones(otId as string),
    enabled: !!otId,
    staleTime: 30 * 1000,
  });
};

/**
 * POST /ots/:id/programacion (ots:manage-responsables). Invalidates the OT
 * list (Responsable(s) column + "Mis OTs" tab), the programaciones history,
 * and the single-OT detail (`canWork` recompute) on success.
 */
export const useSetOtProgramacion = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<OtProgramacionEntry>, AxiosError<any>, { otId: string; data: SetOtProgramacionDto }>({
    mutationFn: ({ otId, data }) => otService.setProgramacion(otId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['ots'] });
      qc.invalidateQueries({ queryKey: ['ots', vars.otId, 'programaciones'] });
      qc.invalidateQueries({ queryKey: ['ots', vars.otId] });
      toast.success('Programación guardada.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'No fue posible guardar la programación.';
      toast.error(msg);
    },
  });
};
