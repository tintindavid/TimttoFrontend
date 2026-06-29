import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import {
  CreateServiceQrDto,
  RotateServiceQrPasswordDto,
  ServiceQr,
  ServiceQrListFilters,
} from '@/types/serviceQr.types';
import { serviceQrService } from '@/services/serviceQr.service';

export const serviceQrKeys = {
  all: ['service-qrs'] as const,
  lists: () => [...serviceQrKeys.all, 'list'] as const,
  list: (filters?: ServiceQrListFilters) =>
    [...serviceQrKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...serviceQrKeys.all, 'detail', id] as const,
};

/* ---------- Queries ---------- */

export const useServiceQrs = (filters?: ServiceQrListFilters) => {
  return useQuery<ApiResponse<ServiceQr[]>, Error>({
    queryKey: serviceQrKeys.list(filters),
    queryFn: () => serviceQrService.list(filters),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });
};

export const useServiceQrDetail = (id: string | undefined) => {
  return useQuery<ApiResponse<ServiceQr>, Error>({
    queryKey: serviceQrKeys.detail(id ?? ''),
    queryFn: () => serviceQrService.getById(id as string),
    enabled: !!id,
  });
};

/* ---------- Mutations ---------- */

export const useCreateServiceQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ServiceQr>, Error, CreateServiceQrDto>({
    mutationFn: (data) => serviceQrService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceQrKeys.lists() });
    },
  });
};

export const useRotateQrPassword = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ServiceQr>,
    Error,
    { id: string; data: RotateServiceQrPasswordDto }
  >({
    mutationFn: ({ id, data }) => serviceQrService.rotatePassword(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: serviceQrKeys.lists() });
      qc.invalidateQueries({ queryKey: serviceQrKeys.detail(vars.id) });
    },
  });
};

export const useDeactivateQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ServiceQr>, Error, string>({
    mutationFn: (id) => serviceQrService.deactivate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: serviceQrKeys.lists() });
      qc.invalidateQueries({ queryKey: serviceQrKeys.detail(id) });
    },
  });
};

export const useActivateQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ServiceQr>, Error, string>({
    mutationFn: (id) => serviceQrService.activate(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: serviceQrKeys.lists() });
      qc.invalidateQueries({ queryKey: serviceQrKeys.detail(id) });
    },
  });
};

export const useDeleteQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => serviceQrService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceQrKeys.lists() });
    },
  });
};
