import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { actividadService } from '@/services/actividad.service';
import { CreateActividadDto, UpdateActividadDto, ActividadMtto } from '@/types/actividad.types';
import { ApiResponse } from '@/types/api.types';

type ActividadesQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
};

export const useActividades = (
  params?: ActividadesQueryParams, 
  options?: Partial<UseQueryOptions<ApiResponse<ActividadMtto[]>>>
) => {
  return useQuery<ApiResponse<ActividadMtto[]>>({ 
    queryKey: ['actividades', params], 
    queryFn: () => actividadService.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutos de cache por defecto
    cacheTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchOnWindowFocus: false, // No refetch al cambiar ventana
    ...options // Permitir override de opciones
  });
};

export const useActividad = (id?: string) => {
  return useQuery<ApiResponse<ActividadMtto>>({ 
    queryKey: ['actividad', id], 
    queryFn: () => actividadService.getById(id as string), 
    enabled: !!id 
  });
};

export const useCreateActividad = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ActividadMtto>, Error, CreateActividadDto>({
    mutationFn: (payload: CreateActividadDto) => actividadService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actividades'] }),
  });
};

export const useUpdateActividad = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ActividadMtto>, Error, { id: string; payload: UpdateActividadDto }>({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateActividadDto }) => actividadService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actividades'] }),
  });
};

export const useDeleteActividad = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id: string) => actividadService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['actividades'] }),
  });
};

export default useActividades;
