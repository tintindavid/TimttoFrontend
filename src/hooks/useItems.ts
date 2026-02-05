import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService } from '@/services/items.service';

export const useItems = (params?: any) => {
  return useQuery({ queryKey: ['items', params], queryFn: () => itemService.getAll(params) });
};

export const useItem = (id?: string) => {
  return useQuery({ queryKey: ['item', id], queryFn: () => itemService.getById(id as string), enabled: !!id });
};

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => itemService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => itemService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
};

export default useItems;
