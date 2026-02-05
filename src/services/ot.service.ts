import { BaseService } from './base.service';
import { OT, CreateOtDto, UpdateOtDto } from '@/types/ot.types';

class OtService extends BaseService<OT, CreateOtDto, UpdateOtDto> {
  constructor() {
    super('/ots');
  }

  // Métodos adicionales relacionados a OTs si aplica
  async assignResponsible(otId: string, userId: string) {
    const response = await this.patch(otId, { ResponsableId: userId } as any);
    return response;
  }
}

export const otService = new OtService();
