/** Non-blocking warning returned when creating a requisicion from solicitudes (e.g. a quantity defaulted to 1). */
export interface RequisicionAdvertencia {
  repuestoId?: string;
  campo?: string;
  valorOriginal?: unknown;
  mensaje: string;
}

export interface Repuesto {
  _id?: string;
  tenantId: string;
  Cantidad: string;
  nombre: string;
  CantidadInstalacion?: number;
  Currency?: string;
  EquipoId: string;
  EstadoAnterior?: string;
  EstadoSolicitud?: string;
  ExchangeRate?: number;
  FechaInstalacion?: Date;
  FechaSolicitud?: Date;
  observacion?: string;
  ObservacionInstalacion?: string;
  OrdenId: string;
  origenRepuesto?: string;
  PrecioRepuesto?: number;
  Prioridad?: string;
  ReporteInstalacionId?: string;
  ReporteSolicitudId: string;
  ClienteId?: string;
  InventarioItemId?: string;
  ResponsableInstalacion?: {
    _id: string;
    firstName?: string;
    lastName?: string;  
  };
  ResponsableSolicitud: {
    _id: string;
    firstName?: string;
    lastName?: string;  
  };
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: string;
  updatedAt?: string;
  /** Requisition link; only returned when the tenant has `usesRequisiciones`. */
  requisicion?: RepuestoRequisicionResumen | null;
}

export interface CreateRepuestoSolicitudDto {
  nombre: string;
  ClienteId?: string;
  InventarioItemId?: string;
  Cantidad: string;
  Currency?: string;
  observacion?: string;
  origenRepuesto?: string;
  PrecioRepuesto?: number;
  Prioridad?: string;
  ResponsableSolicitud: string;
  EstadoSolicitud?: string;
  FechaInstalacion?: Date;

}

export interface InstalarRepuestoDto {
  _id: string;
  CantidadInstalacion: number;
  FechaInstalacion: Date;
  ObservacionInstalacion?: string;
  ResponsableInstalacion: string;
  PrecioRepuesto?: number;
}

export type EstadoSolicitudRepuesto = 'Solicitado' | 'En Proceso' | 'Rechazado' | 'Instalado';
export type PrioridadRepuesto = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type OrigenRepuesto = 'Inventario' | 'Compra' | 'Garantia' | 'Donacion' | 'Cliente';

// ---------------------------------------------------------------------------
// Requisition link (premium module `usesRequisiciones`, epic E2). Only present when the module is on.
// ---------------------------------------------------------------------------

export type RepuestoDisponibilidad =
  | 'En_Requisicion'
  | 'En_Aprobacion'
  | 'En_Compra'
  | 'En_Camino'
  | 'En_Abastecimiento'
  | 'Recibida'
  | 'Disponible'
  | 'En_Disputa'
  | 'Cancelada';

export interface RepuestoRequisicionResumen {
  requisicionId: string;
  consecutivo?: string;
  lineaId?: string;
  disponibilidad?: RepuestoDisponibilidad;
  cantidadConfirmada?: number;
}

/** Filter values of GET /repuestos `requisicionEstado`. */
export type RepuestoRequisicionFiltro = '' | 'sin' | 'con' | RepuestoDisponibilidad;

export interface RequisicionLineaSolicitudInput {
  repuestoId: string;
  cantidad?: number;
  precioEstimado?: number;
  descripcion?: string;
}

/** POST /repuestos/requisicion */
export interface CreateRequisicionFromSolicitudesDto {
  repuestoIds: string[];
  titulo?: string;
  tipoRequisicionId: string;
  areaId: string;
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  fechaRequerida?: string;
  justificacion?: string;
  lineas?: RequisicionLineaSolicitudInput[];
  enviar?: boolean;
}

export interface OmitirRequisicionDto {
  omitirRequisicion: boolean;
  motivoOmision: string;
}
