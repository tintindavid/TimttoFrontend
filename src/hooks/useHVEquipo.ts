import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { hvEquipoService } from '@/services/hvEquipo.service';
import { HVEquipo, CreateHVEquipoDto, UpdateHVEquipoDto, HVEquipoFilters } from '@/types/hvEquipo.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Hook para obtener todas las HV Equipos con filtros
 */
export const useHVEquipos = (filters?: HVEquipoFilters) => {
  return useQuery<ApiResponse<HVEquipo[]>, Error>({
    queryKey: ['hv-equipos', filters],
    queryFn: () => hvEquipoService.getAll(filters),
    keepPreviousData: true,
  });
};

/**
 * Hook para obtener una HV Equipo por ID
 */
export const useHVEquipo = (
  id: string, 
  options?: Partial<UseQueryOptions<ApiResponse<HVEquipo>, Error>>
) => {
  return useQuery<ApiResponse<HVEquipo>, Error>({
    queryKey: ['hv-equipos', id],
    queryFn: () => hvEquipoService.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para obtener HV Equipos aprobadas por marca y modelo
 */
export const useHVEquiposByMarcaModelo = (
  marca: string,
  modelo: string,
  filters?: HVEquipoFilters
) => {
  return useQuery<ApiResponse<HVEquipo[]>, Error>({
    queryKey: ['hv-equipos', 'marca-modelo', marca, modelo, filters],
    queryFn: () => hvEquipoService.getByMarcaModelo(marca, modelo, filters),
    enabled: !!marca && !!modelo,
  });
};

/**
 * Hook para obtener HV Equipo por EquipoId
 */
export const useHVEquipoByEquipoId = (
  equipoId: string,
  options?: Partial<UseQueryOptions<ApiResponse<HVEquipo>, Error>>
) => {
  return useQuery<ApiResponse<HVEquipo>, Error>({
    queryKey: ['hv-equipos', 'equipo', equipoId],
    queryFn: () => hvEquipoService.getByEquipoId(equipoId),
    enabled: !!equipoId,
    ...options,
  });
};

/**
 * Hook para crear una HV Equipo
 */
export const useCreateHVEquipo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateHVEquipoDto) => hvEquipoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hv-equipos'] });
    },
  });
};

/**
 * Hook para actualizar una HV Equipo
 */
export const useUpdateHVEquipo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHVEquipoDto }) => 
      hvEquipoService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hv-equipos'] });
      queryClient.invalidateQueries({ queryKey: ['hv-equipos', variables.id] });
    },
  });
};

/**
 * Hook para eliminar una HV Equipo
 */
export const useDeleteHVEquipo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => hvEquipoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hv-equipos'] });
    },
  });
};
