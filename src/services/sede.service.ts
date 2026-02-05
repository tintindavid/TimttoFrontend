import { BaseService } from './base.service';
import { Sede, CreateSedeDto, UpdateSedeDto } from '@/types/sede.types';

class SedeService extends BaseService<Sede, CreateSedeDto, UpdateSedeDto> {
  constructor() {
    super('/sedes');
  }

  // Get sedes by customer ID
  getByCustomerId = async (customerId: string, params?: any) => {
    const queryParams = { ...params, Cliente: customerId };
    return this.getAll(queryParams);
  };
}

export const sedeService = new SedeService();