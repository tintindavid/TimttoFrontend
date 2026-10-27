import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tipoRequisicionService } from '@/services/tipoRequisicion.service';
import {
  TipoRequisicionQueryParams,
  CreateTipoRequisicionDto,
  UpdateTipoRequisicionDto,
} from '@/types/requisicion.types';

const KEY = 'tipos-requisicion';

export const useGetTiposRequisicion = (params: TipoRequisicionQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => tipoRequisicionService.list(params),
    enabled,
    keepPreviousData: true,
  });

export const useGetTipoRequisicion = (id?: string) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => tipoRequisicionService.getById(id as string),
    enabled: !!id,
  });

export const useCreateTipoRequisicion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTipoRequisicionDto) => tipoRequisicionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useUpdateTipoRequisicion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTipoRequisicionDto }) => tipoRequisicionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};

export const useDeleteTipoRequisicion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tipoRequisicionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries([KEY]);
    },
  });
};
