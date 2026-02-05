import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { sedeService } from '@/services/sede.service';
import { Sede, CreateSedeDto, UpdateSedeDto } from '@/types/sede.types';
import { ApiResponse, QueryParams } from '@/types/api.types';

/**
 * Hook para obtener lista de sedes
 */
export const useSedes = (
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<Sede[]>>
) => {
  return useQuery({
    queryKey: ['sedes', params],
    queryFn: () => sedeService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
};

/**
 * Hook para obtener sedes por cliente
 */
export const useSedesByCustomer = (
  customerId: string,
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<Sede[]>>
) => {
  return useQuery({
    queryKey: ['sedes', 'customer', customerId, params],
    queryFn: () => sedeService.getByCustomerId(customerId, params),
    enabled: !!customerId && customerId.length > 0,
    keepPreviousData: true,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
};

/**
 * Hook para obtener una sede por ID
 */
export const useSede = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Sede>>
) => {
  return useQuery({
    queryKey: ['sedes', id],
    queryFn: () => sedeService.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear una sede
 */
export const useCreateSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSedeDto) => sedeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      toast.success('Sede creada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear sede';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar una sede
 */
export const useUpdateSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSedeDto }) =>
      sedeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      queryClient.invalidateQueries({ queryKey: ['sedes', variables.id] });
      toast.success('Sede actualizada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar sede';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar una sede
 */
export const useDeleteSede = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sedeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedes'] });
      toast.success('Sede eliminada exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar sede';
      toast.error(message);
    },
  });
};