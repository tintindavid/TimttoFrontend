import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reglaAprobacionService } from '@/services/reglaAprobacion.service';
import {
  ReglaAprobacionQueryParams,
  CreateReglaAprobacionDto,
  UpdateReglaAprobacionDto,
} from '@/types/requisicion.types';

const KEY = 'reglas-aprobacion';

export const useGetReglasAprobacion = (params: ReglaAprobacionQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => reglaAprobacionService.list(params),
    enabled,
    keepPreviousData: true,
  });

export const useGetReglaAprobacion = (id?: string) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => reglaAprobacionService.getById(id as string),
    enabled: !!id,
  });

export const useCreateReglaAprobacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReglaAprobacionDto) => reglaAprobacionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useUpdateReglaAprobacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReglaAprobacionDto }) => reglaAprobacionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useDeleteReglaAprobacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reglaAprobacionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};
