export interface Item {
  _id?: string;
  tenantId?: string;
  Nombre: string;
  Observacion?: string;
  ProtocoloId?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  Iva?: number;
  IvaIncluido?: boolean;
  Precio?: number;
}

export interface CreateItemDto {
  Nombre: string;
  Observacion?: string;
  ProtocoloId?: string;
  Iva?: number;
  IvaIncluido?: boolean;
  Precio?: number;
}

export interface UpdateItemDto {
  Nombre?: string;
  Observacion?: string;
  ProtocoloId?: string;
  Iva?: number;
  IvaIncluido?: boolean;
  Precio?: number;
}