// Tipos adicionales para reportes y mantenimiento
export interface Reporte {
  _id?: string;
  OtId?: string;
  ClienteId:{
    Ciudad: String,
    Departamento: String,
    Direccion: String,
    Razonsocial: String,
    TelContacto: String,
    Nit: String,
    UserContacto: String,
  }
  consecutivo?: string; // Nuevo campo para mostrar número de reporte o estado como 'Cerrado'
  numeroHoja: string; // Puede ser 'Cerrado' para reportes cerrados
  observacionEstadoFinal?: string;
  ResponsableMtto: {
    firstName: string;
    lastName: string;
    role?: string;
    _id: string;
  };
  fechaFinalizdo?: string;
  Equipo?: {
    Invima?: string;
    Riesgo: string;
     ClienteId?: string;
     SedeId?: string;
     Servicio?: string;
    _id: string;
    mesesMtto?: string[];
    ItemId?: {
      _id: string;
      ProtocoloId?: string;
    };
  };
  equipoSnapshot: {
    ItemText: string;
    Marca: string;
    Modelo: string;
    Serie: string;
    Inventario?: string;
    Ubicacion?: string;
    SedeId?: string;
    ServicioId?: string;
    Sede?: string;
    Servicio?: string;
    Riesgo?: string;
    Invima?: string;
    mesesMtto?: string[];
  };
  estado: 'Pendiente' | 'En_Progreso' | 'Cerrado' | 'Cancelado' | 'Procesado';
  procesado: boolean;
  fechaProcesado?: Date;
  fechaMtto?: Date;
  fechaFinalizado?: Date;
  responsableProcesado?: string;
  actividadesRealizadas?: ActividadRealizada[];
  duracion?: number;
  hojaDeTrabajo: string; // Nuevo campo para mostrar número de hoja de trabajo o estado como 'Cerrado'
  evidencias?: Evidencia[];
  repuestos?: RepuestoReporte[];
  fallaReportada?: string;
  diagnostico?: string;
  accionTomada?: string;
  causaEncontrada?: string;
  motivoFueraServicio?: string;
  fechaCancelacion?: Date;
  motivoCancelacion?: string;
  observacion?: string;
  resumen?: {
    actividadesCompletadas?: number;
    totalActividades?: number;
    porcentajeCompletado?: number;
    cantidadRepuestos?: number;
    observacion?: string;
    causaEncontrada?: string;
    motivoFueraServicio?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  estadoOperativo?: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio' |'Dado de Baja';
  orden?: {
    _id: string;
    Consecutivo: string;
  };
  tipoMtto?:String;
}

export interface ActividadRealizada {
  _id?: string;
  actividad?: string;
  nombre?: string;
  descripcion: string;
  realizado: boolean; // Cambio de 'realizada' a 'realizado' para coincidir con datos reales
  fecha: string | null; // Puede ser null según datos reales
  observaciones?: string;
  actividadProtocoloId: string; // Requerido para coincidir con datos reales
  duracion?: number; // Duración en minutos, opcional
}

export interface Evidencia {
  _id?: string;
  url: string;
  storagePath?: string;
  nombre: string;
  tipo: 'imagen';
  mimetype?: 'image/jpeg' | 'image/png';
  size?: number;
  descripcion?: string;
  fechaSubida: string;
  uploadedBy?: string;
  archivo?: File;       // local-only, for pre-save previews
  isPending?: boolean;  // local-only flag
}

export const EVIDENCE_LIMITS = {
  MAX_COUNT: 3,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIME: ['image/jpeg', 'image/png'] as const,
  ALLOWED_ACCEPT: 'image/jpeg,image/png',
  MAX_DESCRIPTION_LENGTH: 120,
};

export interface RepuestoReporte {
  _id?: string;
  nombre: string;
  cantidad: number;
  estado: 'Solicitado' | 'Aprobado' | 'Instalado' | 'Rechazado';
  fechaSolicitud: string;
  fechaInstalacion?: string;
  motivo?: string;
  costo?: number;
}

export interface SheetWork {
  _id?: string;
  OtId: string;
  numeroHoja: string;
  personaRecibe: string;
  responsable: string;
  cargoResponsable?: string;
  cargoRecibe?: string;
  fullName?: string;
  fullNameResponsable?: string;
  firmaFile?: string;
  firmaResponsableFile?: string;  
  reports:  [{
    numeroHoja: string;
    _id: string;
    fechaProcesado?: string;
    inHt: boolean;
    consecutivo?: string; // Nuevo campo para mostrar número de reporte o estado como 'Cerrado'
    tipoMtto?: string;
    equipoSnapshot: {
      ItemText: string;
      Marca: string;
      Modelo: string;
      Serie: string;
      Inventario?: string;
      Ubicacion?: string;
      SedeId?: string;
      ServicioId?: string;
      Sede?: string;
      Servicio?: string;
      mesesMtto?: string[];
    };
  }];
  // mostrar el body del array como string
  firmaCliente?: string;
  firmaResponsable?: string;
  fechaCreacion: string;
  estado: 'Borrador' | 'Firmada' | 'Cerrada';
  observaciones?: string;
  createdAt: string;
  clienteId?:{
    Ciudad: String,
    Departamento: String,
    Direccion: String,
    Email: String,
    Logo: String,
    Nit: Number,
    Razonsocial: String,
    TelContacto: String
  }
}

