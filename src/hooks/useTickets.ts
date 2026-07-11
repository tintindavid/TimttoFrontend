import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import {
  AddTicketNoteDto,
  AssignTicketDto,
  CancelTicketDto,
  CreateOTFromTicketsDto,
  CreateOTFromTicketsResponse,
  CreateTicketBatchDto,
  CreateTicketBatchResponse,
  Ticket,
  TicketBatchSummary,
  TicketListFilters,
  TicketStats,
} from '@/types/ticket.types';
import { ticketService } from '@/services/ticket.service';

/** Query keys centralised so invalidations stay consistent. */
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: TicketListFilters) =>
    [...ticketKeys.lists(), filters ?? {}] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  batch: (batchId: string) => [...ticketKeys.all, 'batch', batchId] as const,
  stats: (filters?: Partial<TicketListFilters>) =>
    [...ticketKeys.all, 'stats', filters ?? {}] as const,
};

/* ---------- Queries ---------- */

export const useTicketsList = (filters?: TicketListFilters) => {
  return useQuery<ApiResponse<Ticket[]>, Error>({
    queryKey: ticketKeys.list(filters),
    queryFn: () => ticketService.list(filters),
    keepPreviousData: true,
    staleTime: 60 * 1000,
  });
};

export const useTicketDetail = (id: string | undefined) => {
  return useQuery<ApiResponse<Ticket>, Error>({
    queryKey: ticketKeys.detail(id ?? ''),
    queryFn: () => ticketService.getById(id as string),
    enabled: !!id,
  });
};

export const useTicketsByBatch = (batchId: string | undefined) => {
  return useQuery<ApiResponse<TicketBatchSummary>, Error>({
    queryKey: ticketKeys.batch(batchId ?? ''),
    queryFn: () => ticketService.getByBatch(batchId as string),
    enabled: !!batchId,
  });
};

export const useTicketStats = (
  filters?: Partial<TicketListFilters>
) => {
  return useQuery<ApiResponse<TicketStats>, Error>({
    queryKey: ticketKeys.stats(filters),
    queryFn: () =>
      ticketService.getStats(filters as Parameters<typeof ticketService.getStats>[0]),
    staleTime: 60 * 1000,
  });
};

/* ---------- Mutations ---------- */

export const useCreateTicketsBatch = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<CreateTicketBatchResponse>,
    Error,
    CreateTicketBatchDto
  >({
    mutationFn: (data) => ticketService.createBatch(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
};

export const useAssignTicket = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Ticket>,
    Error,
    { id: string; data: AssignTicketDto }
  >({
    mutationFn: ({ id, data }) => ticketService.assign(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) });
    },
  });
};

export const useAddTicketNote = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Ticket>,
    Error,
    { id: string; data: AddTicketNoteDto }
  >({
    mutationFn: ({ id, data }) => ticketService.addNote(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

export const useCreateOTFromTickets = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<CreateOTFromTicketsResponse>,
    Error,
    CreateOTFromTicketsDto
  >({
    mutationFn: (data) => ticketService.createWorkOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ticketKeys.all });
      qc.invalidateQueries({ queryKey: ['ots'] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

export const useCancelTicket = () => {
  const qc = useQueryClient();
  return useMutation<
    ApiResponse<Ticket>,
    Error,
    { id: string; data: CancelTicketDto }
  >({
    mutationFn: ({ id, data }) => ticketService.cancel(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) });
    },
  });
};
