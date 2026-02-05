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

}

export interface CreateRepuestoSolicitudDto {
  nombre: string;
  Cantidad: string;
  Currency?: string;
  observacion?: string;
  origenRepuesto?: string;
  PrecioRepuesto?: number;
  Prioridad?: string;
  ResponsableSolicitud: string;
}

export interface InstalarRepuestoDto {
  _id: string;
  CantidadInstalacion: number;
  FechaInstalacion: Date;
  ObservacionInstalacion?: string;
  ResponsableInstalacion: string;
}

export type EstadoSolicitudRepuesto = 'Solicitado' | 'Aprobado' | 'Rechazado' | 'Instalado';
export type PrioridadRepuesto = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type OrigenRepuesto = 'Inventario' | 'Compra' | 'Garantia' | 'Donacion' | 'Cliente';