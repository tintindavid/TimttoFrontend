export interface InventarioRepuesto {
  _id?: string;
  tenantId?: string;
  nombre: string;
  referencia?: string;
  descripcion?: string;
  stockActual: number;
  stockMinimo?: number;
  unidad?: string;
  precio?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventarioRepuestoDto {
  nombre: string;
  referencia?: string;
  descripcion?: string;
  stockActual: number;
  stockMinimo?: number;
  unidad?: string;
  precio?: number;
}

export interface UpdateInventarioRepuestoDto {
  nombre?: string;
  referencia?: string;
  descripcion?: string;
  stockActual?: number;
  stockMinimo?: number;
  unidad?: string;
  precio?: number;
}

export interface InventarioRepuestoQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  stockBajo?: boolean;
}
