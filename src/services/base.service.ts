import { logger } from '@/utils/logger';
import { api } from './api';
import { ApiResponse } from '@/types/api.types';

export class BaseService<T, CreateDto = any, UpdateDto = any> {
  constructor(private endpoint: string) {}

  async getAll(params?: any): Promise<ApiResponse<T[]>> {
    console.log(`[${this.endpoint}] Params enviados al backend:`, params);
    const response = await api.get<ApiResponse<T[]>>(this.endpoint, { params });
    console.log(`[${this.endpoint}] Respuesta del backend:`, response.data);
    return response.data;
  }

  async getById(id: string, populate?: string[]): Promise<ApiResponse<T>> {
    const params = populate ? { populate: populate.join(',') } : undefined;
    const response = await api.get<ApiResponse<T>>(`${this.endpoint}/${id}`, { params });
    return response.data;
  }

  async create(data: CreateDto): Promise<ApiResponse<T>> {
    console.log(`[${this.endpoint}] CREATE - Datos a enviar:`, data);
    logger.debug(`[${this.endpoint}] Es FormData:`, data instanceof FormData);
    const response = await api.post<ApiResponse<T>>(this.endpoint, data);
    logger.debug(`[${this.endpoint}] CREATE - Respuesta:`, response.data);
    return response.data;
  }

  async update(id: string, data: UpdateDto): Promise<ApiResponse<T>> {
    logger.debug(`[${this.endpoint}] UPDATE - ID: ${id}, Datos a enviar:`, data);
    logger.debug(`[${this.endpoint}] Es FormData:`, data instanceof FormData);
    const response = await api.put<ApiResponse<T>>(`${this.endpoint}/${id}`, data);
    logger.debug(`[${this.endpoint}] UPDATE - Respuesta:`, response.data);
    return response.data;
  }

  async patch(id: string, data: Partial<UpdateDto>): Promise<ApiResponse<T>> {
    const response = await api.patch<ApiResponse<T>>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
    return response.data;
  }
}
