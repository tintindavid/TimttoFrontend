import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { areaService } from '@/services/area.service';
import {
  AreaQueryParams,
  CreateAreaDto,
  UpdateAreaDto,
} from '@/types/requisicion.types';

const KEY = 'areas';

export const useGetAreas = (params: AreaQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => areaService.list(params),
    enabled,
    keepPreviousData: true,
  });

export const useGetArea = (id?: string) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => areaService.getById(id as string),
    enabled: !!id,
  });

export const useCreateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAreaDto) => areaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useUpdateArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAreaDto }) => areaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useDeleteArea = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => areaService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};
