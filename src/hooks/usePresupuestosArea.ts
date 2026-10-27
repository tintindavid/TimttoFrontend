import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { presupuestoAreaService } from '@/services/presupuestoArea.service';
import {
  PresupuestoResumenParams,
  PresupuestoAreaQueryParams,
  CreatePresupuestoAreaDto,
  UpdatePresupuestoAreaDto,
} from '@/types/requisicion.types';

const KEY = 'presupuestos-area';

export const useGetPresupuestosArea = (params: PresupuestoAreaQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => presupuestoAreaService.list(params),
    enabled,
    keepPreviousData: true,
  });

export const useGetPresupuestoArea = (id?: string) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => presupuestoAreaService.getById(id as string),
    enabled: !!id,
  });

export const useCreatePresupuestoArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePresupuestoAreaDto) => presupuestoAreaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useUpdatePresupuestoArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePresupuestoAreaDto }) => presupuestoAreaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useDeletePresupuestoArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presupuestoAreaService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

/** Budget summary of an area and period (consumed / committed / available). */
export const useGetPresupuestoResumen = (params?: PresupuestoResumenParams, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'resumen', params],
    queryFn: () => presupuestoAreaService.getResumen(params as PresupuestoResumenParams),
    enabled: enabled && !!params?.areaId && !!params?.periodo,
  });
