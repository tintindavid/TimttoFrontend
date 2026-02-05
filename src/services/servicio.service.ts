import { BaseService } from './base.service';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types/servicio.types';

class ServicioService extends BaseService<Servicio, CreateServicioDto, UpdateServicioDto> {
  constructor() {
    super('/servicios');
  }

  // Get servicios by customer ID
  getByCustomerId = async (customerId: string, params?: any) => {
    const queryParams = { ...params, Cliente: customerId };
    return this.getAll(queryParams);
  };
}

export const servicioService = new ServicioService();