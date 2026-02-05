export interface Servicio {
  _id?: string;
  tenantId?: string;
  UbicacionPK?: string;
  ServicioId?: string;
  Cliente?: string; // Customer ID
  nombre: string;
  Status?: string;
  observacion?: string;
  StatusReason?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateServicioDto {
  Cliente: string; // Required Customer ID
  nombre: string;
  observacion?: string;
  Status?: string;
}

export interface UpdateServicioDto {
  nombre?: string;
  observacion?: string;
  Status?: string;
  StatusReason?: string;
}