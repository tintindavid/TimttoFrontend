export interface Item {
  _id?: string;
  tenantId?: string;
  Nombre: string;
  Observacion?: string;
  ProtocoloId?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemDto {
  Nombre: string;
  Observacion?: string;
  ProtocoloId?: string;
}

export interface UpdateItemDto {
  Nombre?: string;
  Observacion?: string;
  ProtocoloId?: string;
}