import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { servicioService } from '@/services/servicio.service';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types/servicio.types';
import { ApiResponse, QueryParams } from '@/types/api.types';

/**
 * Hook para obtener lista de servicios
 */
export const useServicios = (
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<Servicio[]>>
) => {
  return useQuery({
    queryKey: ['servicios', params],
    queryFn: () => servicioService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
};

/**
 * Hook para obtener servicios por cliente
 */
export const useServiciosByCustomer = (
  customerId: string,
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<Servicio[]>>
) => {
  return useQuery({
    queryKey: ['servicios', 'customer', customerId, params],
    queryFn: () => servicioService.getByCustomerId(customerId, params),
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
 * Hook para obtener un servicio por ID
 */
export const useServicio = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Servicio>>
) => {
  return useQuery({
    queryKey: ['servicios', id],
    queryFn: () => servicioService.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear un servicio
 */
export const useCreateServicio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServicioDto) => servicioService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear servicio';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar un servicio
 */
export const useUpdateServicio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicioDto }) =>
      servicioService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios', variables.id] });
      toast.success('Servicio actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar servicio';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar un servicio
 */
export const useDeleteServicio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      toast.success('Servicio eliminado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar servicio';
      toast.error(message);
    },
  });
};