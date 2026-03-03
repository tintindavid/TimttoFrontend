import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipoItemService } from '@/services/equipoItem.service';
import { EquipoItem, CreateEquipoItemDto, UpdateEquipoItemDto } from '@/types/equipoItem.types';

export const useEquipoItems = (params?: any) => {
  // Si no se especifica limit, usar 100 por defecto (en lugar del 10 del backend)
  const queryParams = {
    limit: 1000,
    ...params
  };

  return useQuery({
    queryKey: ['equipo-items', queryParams],
    queryFn: () => equipoItemService.getAll(queryParams),
    enabled: !!queryParams?.ClienteId,
    keepPreviousData: true,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

export const useEquipoItem = (id: string) => {
  return useQuery(['equipo-items', id], () => equipoItemService.getById(id), { enabled: !!id });
};

// servicio para utilizar la ruta equipo-item/507f1f77bcf86cd799439011/populated
export const useEquipoItemPopulated = (id: string) => {
  return useQuery(['equipo-items', 'populated', id], () => equipoItemService.getByIdPopulated(id), { enabled: !!id });
}

export const useCreateEquipoItem = () => {
  const qc = useQueryClient();
  return useMutation((data: CreateEquipoItemDto) => equipoItemService.create(data), {
    onSuccess: () => qc.invalidateQueries(['equipo-items']),
  });
};

export const useUpdateEquipoItem = () => {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: UpdateEquipoItemDto }) => equipoItemService.update(id, data), {
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['equipo-items']);
      qc.invalidateQueries(['equipo-items', vars.id]);
    },
  });
};

export const useDeleteEquipoItem = () => {
  const qc = useQueryClient();
  return useMutation((id: string) => equipoItemService.delete(id), {
    onSuccess: () => qc.invalidateQueries(['equipo-items']),
  });
};
