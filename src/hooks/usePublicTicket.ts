import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import {
  PublicSessionDescriptors,
  PublicValidateAccessDto,
  PublicValidateAccessResponse,
} from '@/types/serviceQr.types';
import {
  CreateTicketBatchPublicDto,
  CreateTicketBatchResponse,
  PublicTicket,
} from '@/types/ticket.types';
import { EquipoItem } from '@/types/equipoItem.types';
import {
  publicSessionStorage,
  publicTicketService,
} from '@/services/publicTicket.service';

export const publicTicketKeys = {
  all: ['public-tickets'] as const,
  session: () => [...publicTicketKeys.all, 'session'] as const,
  equipments: () => [...publicTicketKeys.all, 'equipments'] as const,
  list: () => [...publicTicketKeys.all, 'list'] as const,
  detail: (id: string) => [...publicTicketKeys.all, 'detail', id] as const,
};

/* ---------- Queries ---------- */

export const usePublicSession = (enabled: boolean = true) => {
  return useQuery<ApiResponse<PublicSessionDescriptors>, Error>({
    queryKey: publicTicketKeys.session(),
    queryFn: () => publicTicketService.sessionMe(),
    enabled: enabled && !!publicSessionStorage.getToken(),
    retry: false,
  });
};

export const usePublicEquipments = (enabled: boolean = true) => {
  return useQuery<ApiResponse<EquipoItem[]>, Error>({
    queryKey: publicTicketKeys.equipments(),
    queryFn: () => publicTicketService.listEquipments(),
    enabled: enabled && !!publicSessionStorage.getToken(),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePublicTicketsList = (enabled: boolean = true) => {
  return useQuery<ApiResponse<PublicTicket[]>, Error>({
    queryKey: publicTicketKeys.list(),
    queryFn: () => publicTicketService.listTickets(),
    enabled: enabled && !!publicSessionStorage.getToken(),
    staleTime: 30 * 1000,
  });
};

export const usePublicTicketDetail = (id: string | undefined) => {
  return useQuery<ApiResponse<PublicTicket>, Error>({
    queryKey: publicTicketKeys.detail(id ?? ''),
    queryFn: () => publicTicketService.getTicket(id as string),
    enabled: !!id && !!publicSessionStorage.getToken(),
  });
};

/* ---------- Mutations ---------- */

export const useValidateAccess = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<PublicValidateAccessResponse>,
    Error,
    PublicValidateAccessDto
  >({
    mutationFn: (data) => publicTicketService.validateAccess(data),
    onSuccess: (res, vars) => {
      if (res.data?.sessionToken) {
        publicSessionStorage.setToken(res.data.sessionToken);
        publicSessionStorage.setQrToken(vars.qrToken);
        qc.invalidateQueries({ queryKey: publicTicketKeys.session() });
      }
    },
  });
};

export const useCreatePublicTickets = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<CreateTicketBatchResponse>,
    Error,
    CreateTicketBatchPublicDto
  >({
    mutationFn: (data) => publicTicketService.createTickets(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: publicTicketKeys.list() });
    },
  });
};
