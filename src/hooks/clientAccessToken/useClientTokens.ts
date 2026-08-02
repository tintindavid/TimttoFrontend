import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import {
  ClientAccessToken,
  ClientAccessTokenCreatePayload,
  ClientAccessTokenCreateResponse,
  ClientAccessTokenListFilters,
} from '@/types/clientAccessToken.types';
import { clientAccessTokenService } from '@/services/clientAccessToken.service';

export const clientAccessTokenKeys = {
  all: ['client-access-tokens'] as const,
  lists: () => [...clientAccessTokenKeys.all, 'list'] as const,
  list: (filters?: ClientAccessTokenListFilters) =>
    [...clientAccessTokenKeys.lists(), filters ?? {}] as const,
  detail: (id: string) => [...clientAccessTokenKeys.all, 'detail', id] as const,
};

/* ---------- Queries ---------- */

export const useClientTokensList = (
  clienteId: string | undefined,
  filters?: Omit<ClientAccessTokenListFilters, 'clienteId'>
) => {
  const mergedFilters: ClientAccessTokenListFilters = { ...filters, clienteId };
  return useQuery<ApiResponse<ClientAccessToken[]>, Error>({
    queryKey: clientAccessTokenKeys.list(mergedFilters),
    queryFn: () => clientAccessTokenService.list(mergedFilters),
    enabled: !!clienteId,
    keepPreviousData: true,
  });
};

export const useClientTokenDetail = (id: string | undefined) => {
  return useQuery<ApiResponse<ClientAccessToken>, Error>({
    queryKey: clientAccessTokenKeys.detail(id ?? ''),
    queryFn: () => clientAccessTokenService.getById(id as string),
    enabled: !!id,
  });
};

/* ---------- Mutations ---------- */

export const useCreateClientToken = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<ClientAccessTokenCreateResponse>,
    Error,
    ClientAccessTokenCreatePayload
  >({
    mutationFn: (data) => clientAccessTokenService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.lists() });
    },
  });
};

export const useRevokeClientToken = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ClientAccessToken>, Error, string>({
    mutationFn: (id) => clientAccessTokenService.revoke(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.lists() });
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.detail(id) });
    },
  });
};

export const useDeleteClientToken = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => clientAccessTokenService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientAccessTokenKeys.lists() });
    },
  });
};
