export interface EquipoItem {
  _id?: string;
  item?: string;
  ClienteId?: string;
  Estado?: string;
  ItemId?: {
    _id: string;
    Nombre?: string;
  };
  Marca?: string;
  SedeId?: {
    _id: string;
    nombreSede?: string;
  };
  Serie?: string;
  Servicio?: {
    _id: string;
    nombre?: string;
  };
  Ubicacion?: string;
  Inventario?: string;
  Modelo?: string;
  UltimoMtto?: string; // ISO date
  mesesMtto?: string[];
  StatusReason?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEquipoItemDto {
  item: string;
  ClienteId: string;
  ItemId?: string;
  Marca?: string;
  SedeId?: string;
  Serie?: string;
  Inventario?: string;
  Servicio?: string;
  Ubicacion?: string;
  Modelo?: string;
  Estado?: string;
  mesesMtto?: string[];
  Riesgo?: string;
  Invima?: string;
}

export interface UpdateEquipoItemDto {
  Equipment?: string;
  Marca?: string;
  Serie?: string;
  Servicio?: string;
  Status?: string;
  Area?: string;
  Modelo?: string;
  Ubicacion?: string;
  Estado?: string;
  mesesMtto?: string[];
}
