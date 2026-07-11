import { api } from './api';
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

/**
 * Panel-side axios calls for `/api/tickets/*`.
 * Uses the shared `api` instance (panel auth + tenant headers).
 */
class TicketService {
  private endpoint = '/tickets';

  async list(
    filters?: TicketListFilters
  ): Promise<ApiResponse<Ticket[]>> {
    const res = await api.get<ApiResponse<Ticket[]>>(this.endpoint, {
      params: filters,
    });
    return res.data;
  }

  async getById(id: string): Promise<ApiResponse<Ticket>> {
    const res = await api.get<ApiResponse<Ticket>>(`${this.endpoint}/${id}`);
    return res.data;
  }

  async getByBatch(batchId: string): Promise<ApiResponse<TicketBatchSummary>> {
    const res = await api.get<ApiResponse<TicketBatchSummary>>(
      `${this.endpoint}/batch/${batchId}`
    );
    return res.data;
  }

  async getStats(
    filters?: Pick<
      TicketListFilters,
      'ClienteId' | 'sedeId' | 'servicioId' | 'dateFrom' | 'dateTo'
    >
  ): Promise<ApiResponse<TicketStats>> {
    const res = await api.get<ApiResponse<TicketStats>>(
      `${this.endpoint}/stats`,
      { params: filters }
    );
    return res.data;
  }

  async createBatch(
    data: CreateTicketBatchDto
  ): Promise<ApiResponse<CreateTicketBatchResponse>> {
    const res = await api.post<ApiResponse<CreateTicketBatchResponse>>(
      this.endpoint,
      data
    );
    return res.data;
  }

  async assign(
    id: string,
    data: AssignTicketDto
  ): Promise<ApiResponse<Ticket>> {
    const res = await api.patch<ApiResponse<Ticket>>(
      `${this.endpoint}/${id}/assign`,
      data
    );
    return res.data;
  }

  async addNote(
    id: string,
    data: AddTicketNoteDto
  ): Promise<ApiResponse<Ticket>> {
    const res = await api.post<ApiResponse<Ticket>>(
      `${this.endpoint}/${id}/note`,
      data
    );
    return res.data;
  }

  async createWorkOrder(
    data: CreateOTFromTicketsDto
  ): Promise<ApiResponse<CreateOTFromTicketsResponse>> {
    const res = await api.post<ApiResponse<CreateOTFromTicketsResponse>>(
      `${this.endpoint}/work-order`,
      data
    );
    return res.data;
  }

  async cancel(
    id: string,
    data: CancelTicketDto
  ): Promise<ApiResponse<Ticket>> {
    const res = await api.patch<ApiResponse<Ticket>>(
      `${this.endpoint}/${id}/cancel`,
      data
    );
    return res.data;
  }
}

export const ticketService = new TicketService();
export default ticketService;
