import { BaseService } from './base.service';
import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { OT, CreateOtDto, UpdateOtDto, OtProgramacionEntry, SetOtProgramacionDto } from '@/types/ot.types';

class OtService extends BaseService<OT, CreateOtDto, UpdateOtDto> {
  constructor() {
    super('/ots');
  }

  // Métodos adicionales relacionados a OTs si aplica
  async assignResponsible(otId: string, userId: string) {
    const response = await this.patch(otId, { ResponsableId: userId } as any);
    return response;
  }

  /** POST /ots/:id/programacion — creates a new programación entry (ots:manage-responsables). */
  async setProgramacion(otId: string, data: SetOtProgramacionDto): Promise<ApiResponse<OtProgramacionEntry>> {
    const response = await api.post<ApiResponse<OtProgramacionEntry>>(`/ots/${otId}/programacion`, data);
    return response.data;
  }

  /** GET /ots/:id/programaciones — full history, newest-first. */
  async getProgramaciones(otId: string): Promise<ApiResponse<OtProgramacionEntry[]>> {
    const response = await api.get<ApiResponse<OtProgramacionEntry[]>>(`/ots/${otId}/programaciones`);
    return response.data;
  }
}

export const otService = new OtService();
