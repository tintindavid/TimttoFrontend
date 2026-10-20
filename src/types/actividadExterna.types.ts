export type TipoActividad =
  | 'calibracion' | 'verificacion' | 'ajuste' | 'calificacion'
  | 'modernizacion' | 'reacondicionamiento' | 'actualizacion_sw_fw'
  | 'inspeccion_tecnica' | 'auditoria_seguridad' | 'otro';

export type EstadoCadena = 'vigente' | 'cerrada_manualmente' | 'abandonada';
export type EstadoFinal = 'aprobada' | 'aprobada_con_observaciones' | 'rechazada' | 'pendiente' | 'otro';

export interface Evidencia {
  url: string;
  nombreOriginal: string;
  mimetype: string;
  tamanoBytes: number;
  uploadedAt: string;
}

export interface CadenaActividad {
  _id: string;
  tenantId: string;
  clienteId: string;
  equipoId: string;
  tipo: TipoActividad;
  tipoCustom?: string;
  frecuenciaMeses?: number;
  esUnica: boolean;
  fechaProxima?: string | null;
  estado: EstadoCadena;
  actividadVigenteId?: string | null;
  motivoCierre?: string;
  cerradaAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActividadExterna {
  _id: string;
  tenantId: string;
  clienteId: string;
  equipoId: string;
  cadenaId: string;
  tipo: TipoActividad;
  tipoCustom?: string;
  consecutivoExterno: string;
  fecha: string;
  proveedor: string;
  /** Linked provider third party (Customer kind=provider); null for free-text providers. */
  proveedorId?: string | null;
  observacion?: string;
  /** Operative state of the equipment reported with the activity (absent in activities loaded before the field). */
  estadoOperativo?: string;
  estadoFinal: EstadoFinal;
  estadoFinalCustom?: string;
  evidencia?: Evidencia;
  enlace?: string;
  esInicioCadena: boolean;
  cerradaAt?: string | null;
  cerradaPorActividadId?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CadenaConActividades {
  cadena: CadenaActividad;
  actividades: ActividadExterna[];
}

export interface CreateActividadDto {
  tipo: TipoActividad;
  tipoCustom?: string;
  consecutivoExterno: string;
  fecha: string;
  /** Required unless `proveedorId` is sent (the server then copies the provider name). */
  proveedor?: string;
  proveedorId?: string;
  observacion?: string;
  /** Operative state of the equipment after the activity; becomes its current state when it is the latest service. */
  estadoOperativo?: string;
  estadoFinal: EstadoFinal;
  estadoFinalCustom?: string;
  enlace?: string;
  frecuencia: { meses?: number; esUnica: boolean };
  cadenaIdSucesion?: string;
}

export interface UpdateActividadDto {
  /** Provider id; '' unlinks it (multipart bodies cannot carry null). */
  proveedorId?: string;
  proveedor?: string;
  observacion?: string;
  estadoFinal?: EstadoFinal;
  estadoFinalCustom?: string;
  enlace?: string;
}
