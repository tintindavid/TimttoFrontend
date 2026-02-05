import { SheetWork } from './reporte.types';

export interface OT {
  Consecutivo?: string;
  numeroOT?: string; // For display purposes - could map to Consecutivo
  ClienteId?: {
    _id: string;
    nombre: string; // Fixed typo from Razonsocial
    Razonsocial: string;
    Ciudad: string;
    Departamento: string;
    Email: string;
    Nit: number;
    Direccion: string;
  };
  customerId: { // Alias for ClienteId
    _id: string;
    nombre: string;
  };
  EstadoOt?: string;
  FechaCreacion?: string;
  TipoServicio?: string;
  tipoMantenimiento?: string; // For compatibility
  Avance?: number | string;
  EstadoText?: string;
  reportes?: any[];
  hojasTrabajo?: SheetWork[]; // Worksheets
  OtPrioridad?: string;
  urgencia?: string; // Alias for OtPrioridad
  ResponsableId?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

export interface CreateOtDto {
  ClienteId: string;
  TipoServicio?: string;
  ResponsableId?: string;
  // otros campos según backend
}

export interface UpdateOtDto {
  EstadoOt?: string;
  Avance?: number;
  ResponsableId?: string;
}
