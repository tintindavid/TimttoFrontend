export type InventarioTipo = 'repuesto' | 'accesorio';

export const INVENTARIO_TIPO_LABELS: Record<InventarioTipo, string> = {
  repuesto: 'Repuesto',
  accesorio: 'Accesorio',
};

export interface InventarioRepuesto {
  _id?: string;
  tenantId?: string;
  nombre: string;
  tipo: InventarioTipo;
  activo?: boolean;
  /** Advanced-only fields: omitted by the backend for tenants without usesInventoryAdvanced. */
  referencia?: string;
  descripcion?: string;
  stockActual?: number;
  stockMinimo?: number;
  unidad?: string;
  precio?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Basic level: nombre + tipo. Advanced fields are rejected (403) by the backend without the capability. */
export interface CreateInventarioRepuestoDto {
  nombre: string;
  tipo: InventarioTipo;
  activo?: boolean;
  referencia?: string;
  descripcion?: string;
  stockMinimo?: number;
  unidad?: string;
  precio?: number;
}

/** stockActual is never editable here: it only changes through movements. */
export type UpdateInventarioRepuestoDto = Partial<CreateInventarioRepuestoDto>;

export interface InventarioRepuestoQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  tipo?: InventarioTipo;
  /** Advanced only. */
  stockBajo?: boolean;
  activo?: boolean;
}

export type InventarioMovimientoTipo = 'entrada' | 'salida' | 'ajuste';

export const INVENTARIO_MOVIMIENTO_LABELS: Record<InventarioMovimientoTipo, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};

export interface InventarioMovimiento {
  _id: string;
  tenantId?: string;
  itemId: string;
  tipo: InventarioMovimientoTipo;
  cantidad: number;
  stockAnterior: number;
  stockResultante: number;
  motivo?: string;
  referenciaTipo?: string;
  referenciaId?: string;
  usuarioId?: string;
  createdAt?: string;
}

export interface CreateInventarioMovimientoDto {
  itemId: string;
  tipo: InventarioMovimientoTipo;
  cantidad: number;
  /** Required by the backend for `ajuste`. */
  motivo?: string;
}

export interface InventarioMovimientoQueryParams {
  itemId?: string;
  tipo?: InventarioMovimientoTipo;
  page?: number;
  limit?: number;
}
