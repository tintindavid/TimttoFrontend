// Tipos adicionales para reportes y mantenimiento
export interface Reporte {
  _id?: string;
  OtId?: string;
  numeroHoja: string; // Puede ser 'Cerrado' para reportes cerrados
  observacionEstadoFinal?: string;
  ResponsableMtto: {
    firstName: string;
    lastName: string;
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
    mesesMtto?: string[];
  };
  estado: 'Pendiente' | 'En_Progreso' | 'Cerrado' | 'Cancelado' | 'Procesado';
  procesado: boolean;
  fechaProcesado?: string;
  fechaMtto?: string;
  responsableProcesado?: string;
  actividadesRealizadas?: ActividadRealizada[];
  evidencias?: Evidencia[];
  repuestos?: RepuestoReporte[];
  causaEncontrada?: string;
  motivoFueraServicio?: string;
  fechaCancelacion?: string;
  motivoCancelacion?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
  estadoOperativo?: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio' |'Dado de Baja';
  orden?: {
    _id: string;
    Consecutivo: string;
  };
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
}

export interface Evidencia {
  _id?: string;
  url: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  descripcion: string;
  archivo?: File; // For upload purposes
  fechaSubida: string;
}

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
  fullName?: string;
  firmaResponsableFile?: string;  
  reports:  [{
    numeroHoja: string;
    _id: string;
    fechaProcesado?: string;
    inHt: boolean;
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

