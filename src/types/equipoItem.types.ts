export interface EquipoItem {
  _id?: string;
  item?: string;
  ClienteId?: string;
  Estado?: string;
  EstadoOperativo?: string;
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
  Precio?: number;
  Riesgo?: string;
  Invima?: string;
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
  EstadoOperativo?: string;
  mesesMtto?: string[];
  Riesgo?: string;
  Invima?: string;
  Precio?: number;
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
  EstadoOperativo?: string;
  mesesMtto?: string[];
  Precio?: number;
  Riesgo?: string;
  Invima?: string;
}

/** Query params for `GET /equipo-items/duplicate-check`. */
export interface DuplicateCheckParams {
  ClienteId: string;
  ItemId?: string;
  Marca?: string;
  Serie?: string;
  /** Excludes this equipo id from the comparison — used when editing. */
  excludeId?: string;
}

/** One row of a bulk duplicate-check request. */
export interface DuplicateCheckBulkItem {
  rowId: string;
  ClienteId: string;
  ItemId?: string;
  Marca?: string;
  Serie?: string;
}

export interface DuplicateCheckResult {
  conflict: boolean;
  existing?: EquipoItem;
}

export interface DuplicateCheckBulkResult {
  results: Record<string, DuplicateCheckResult>;
}
