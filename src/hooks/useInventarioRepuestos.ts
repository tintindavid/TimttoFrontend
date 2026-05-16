import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventarioRepuestoService } from '@/services/inventarioRepuesto.service';
import {
  CreateInventarioRepuestoDto,
  InventarioRepuestoQueryParams,
  UpdateInventarioRepuestoDto,
} from '@/types/inventarioRepuesto.types';

export const useInventarioList = (params: InventarioRepuestoQueryParams = {}) => {
  return useQuery({
    queryKey: ['inventario-repuestos', params],
    queryFn: () => inventarioRepuestoService.list(params),
  });
};

export const useInventarioRepuesto = (id?: string) => {
  return useQuery({
    queryKey: ['inventario-repuestos', id],
    queryFn: () => inventarioRepuestoService.getById(id as string),
    enabled: !!id,
  });
};

export const useCreateInventarioRepuesto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventarioRepuestoDto) => inventarioRepuestoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-repuestos'] });
    },
  });
};

export const useUpdateInventarioRepuesto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventarioRepuestoDto }) =>
      inventarioRepuestoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-repuestos'] });
    },
  });
};

export const useDeleteInventarioRepuesto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventarioRepuestoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-repuestos'] });
    },
  });
};
