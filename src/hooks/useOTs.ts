import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { otService } from '@/services/ot.service';
import { OT, CreateOtDto, UpdateOtDto } from '@/types/ot.types';

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
