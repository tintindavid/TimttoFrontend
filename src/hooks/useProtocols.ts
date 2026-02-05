import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { protocolService } from '@/services/protocol.service';
import { CreateProtocolDto, UpdateProtocolDto } from '@/types/protocol.types';

export const useProtocols = (params?: any) => {
  return useQuery({
    queryKey: ['protocols', params],
    queryFn: () => protocolService.getAll(params),
  });
};

export const useProtocol = (id: string) => {
  return useQuery({
    queryKey: ['protocols', id],
    queryFn: () => protocolService.getById(id),
    enabled: !!id,
  });
};

export const useCreateProtocol = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProtocolDto) => protocolService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] });
    },
  });
};

export const useUpdateProtocol = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProtocolDto }) => 
      protocolService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] });
    },
  });
};

export const useDeleteProtocol = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => protocolService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] });
    },
  });
};

export default useProtocols;
