import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import {
  BulkGenerateEquipmentQrDto,
  BulkGenerateEquipmentQrResponse,
  CreateEquipmentQrDto,
  EquipmentQr,
  EquipmentQrBulkFilter,
  EquipmentQrListFilters,
  EquipmentQrListResponse,
} from '@/types/equipmentQr.types';
import { equipmentQrService } from '@/services/equipmentQr.service';

export const equipmentQrKeys = {
  all: ['equipment-qrs'] as const,
  lists: () => [...equipmentQrKeys.all, 'list'] as const,
  list: (filters?: EquipmentQrListFilters) =>
    [...equipmentQrKeys.lists(), filters ?? {}] as const,
};

/* ---------- Queries ---------- */

export const useEquipmentQrs = (filters?: EquipmentQrListFilters) => {
  return useQuery<EquipmentQrListResponse, Error>({
    queryKey: equipmentQrKeys.list(filters),
    queryFn: () => equipmentQrService.list(filters),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });
};

/* ---------- Mutations ---------- */

export const useGenerateEquipmentQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<EquipmentQr>, Error, CreateEquipmentQrDto>({
    mutationFn: (data) => equipmentQrService.generateOne(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: equipmentQrKeys.lists() });
    },
  });
};

export const useGenerateEquipmentQrsBulk = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<BulkGenerateEquipmentQrResponse>,
    Error,
    BulkGenerateEquipmentQrDto
  >({
    mutationFn: (data) => equipmentQrService.generateBulk(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: equipmentQrKeys.lists() });
    },
  });
};

export const useDeactivateEquipmentQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<EquipmentQr>, Error, string>({
    mutationFn: (id) => equipmentQrService.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: equipmentQrKeys.lists() });
    },
  });
};

export const useDeleteEquipmentQr = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<{ ok: true }>, Error, string>({
    mutationFn: (id) => equipmentQrService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: equipmentQrKeys.lists() });
    },
  });
};

export const useExportEquipmentQrPdfOne = () => {
  return useMutation<void, Error, string>({
    mutationFn: (id) => equipmentQrService.exportPdfOne(id),
  });
};

export const useExportEquipmentQrPdfBulk = () => {
  return useMutation<void, Error, { ids?: string[]; filter?: EquipmentQrBulkFilter }>({
    mutationFn: (params) => equipmentQrService.exportPdfBulk(params),
  });
};
