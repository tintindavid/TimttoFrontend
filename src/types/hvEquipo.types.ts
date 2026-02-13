// Tipos para Hoja de Vida de Equipos

export interface HVEquipo {
  _id?: string;
  clienteId: string | {
    _id: string;
    Razonsocial: string;
    Nit: number;
    Ciudad: string;
    Departamento: string;
    Email: string;
    Direccion?: string;
    TelContacto?: string;
    UserContacto?: string;
    Logo?: string;
  };
  EquipoId: string | {
    _id: string;
    ItemId?: {
      _id: string;
      Nombre: string;
      Descripcion?: string;
      Foto?: string;
    };
    Marca?: string;
    Modelo?: string;
    Serie?: string;
    Inventario?: string;
    SedeId?: {
      _id: string;
      nombreSede: string;
    };
    Servicio?: {
      _id: string;
      nombre: string;
    };
    Ubicacion?: string;
    Estado?: string;
    mesesMtto?: string[];
  };
  equipoSnapshot: {
    ItemText?: string;
    Marca?: string;
    Modelo?: string;
    Serie?: string;
    Inventario?: string;
    Servicio?: string;
    Ubicacion?: string;
    Sede?: string;
    MesesMtto?: string[];
  };
  userIdCreacion?: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  
  // Accesorios
  Accesorios?: Accesorio[];
  
  // Información General
  TecnologiaPredominante?: string;
  EstadoHV: 'Guardada' | 'Aprobada';
  Fabricante?: string;
  
  // Fechas importantes
  FechaAdquisicin?: string;
  FechaInstalacion?: string;
  FechaFuncionamiento?: string;
  
  // Información comercial
  ValorAdquisicion?: number;
  TipoAdquisicion?: 'Compra' | 'Donación' | 'Comodato' | 'Leasing' | 'Otro';
  UsoEquipo?: 'Apoyo' | 'Soporte' | 'Produccion' | 'Investigacion' | 'Docencia';
  
  // Mantenimiento y calibración
  RequiereCalibracion?: boolean;
  PeriodicidadCalibracion?: string;
  PeriodicidadMantenimiento?: string;
  
  // Registro y clasificación
  RegistroINVIMA?: string;
  ClasificacinRiesgo?: 'I' | 'IIA' | 'IIB' | 'III';
  TipoEquipo?: string;
  
  // Características eléctricas
  Voltaje?: string;
  Frecuencia?: string;
  Potencia?: string;
  Corriente?: string;
  Peso?: number;
  FuenteAlimentacion?: string;
  AutonomiaBatería?: string;
  
  // Condiciones ambientales
  TemperaturaOperacion?: string;
  HumedadOperacion?: string;
  
  // Proveedor
  NombreProveedor?: string;
  TelefonoProveedor?: string;
  EmailProveedor?: string;
  DireccionProveedor?: string;
  
  // Responsables
  ResponsableTécnico?: string;
  CargoResponsableTécnico?: string;
  
  // Aprobación
  UserAprobacion?: string;
  CargoUserAprobacion?: string;
  FechaAprobacion?: string;
  
  // Observaciones y recomendaciones
  Observaciones?: string;
  ManualDisponible?: boolean;
  PlanoDisponible?: boolean;
  RequiereCapacitacion?: boolean;
  
  // Recomendaciones
  Recomendaciones?: string;
  
  // Foto del equipo en HV
  Foto?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Accesorio {
  _id?: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  estado?: 'Nuevo' | 'Bueno' | 'Regular' | 'Malo';
  observaciones?: string;
}

export interface CreateHVEquipoDto {
  clienteId: string;
  EquipoId: string;
  equipoSnapshot?: {
    ItemText?: string;
    Marca?: string;
    Modelo?: string;
    Serie?: string;
    Inventario?: string;
    Servicio?: string;
    Ubicacion?: string;
    Sede?: string;
    MesesMtto?: string[];
  };
  Accesorios?: Accesorio[];
  TecnologiaPredominante?: string;
  EstadoHV?: 'Guardada' | 'Aprobada';
  Fabricante?: string;
  FechaAdquisicin?: string;
  FechaInstalacion?: string;
  FechaFuncionamiento?: string;
  ValorAdquisicion?: number;
  TipoAdquisicion?: 'Compra' | 'Donación' | 'Comodato' | 'Leasing' | 'Otro';
  UsoEquipo?: 'Apoyo' | 'Soporte' | 'Produccion' | 'Investigacion' | 'Docencia';
  RequiereCalibracion?: boolean;
  PeriodicidadCalibracion?: string;
  PeriodicidadMantenimiento?: string;
  RegistroINVIMA?: string;
  ClasificacinRiesgo?: 'I' | 'IIA' | 'IIB' | 'III';
  TipoEquipo?: string;
  Voltaje?: string;
  Frecuencia?: string;
  Potencia?: string;
  Corriente?: string;
  Peso?: number;
  FuenteAlimentacion?: string;
  AutonomiaBatería?: string;
  TemperaturaOperacion?: string;
  HumedadOperacion?: string;
  NombreProveedor?: string;
  TelefonoProveedor?: string;
  EmailProveedor?: string;
  DireccionProveedor?: string;
  ResponsableTécnico?: string;
  CargoResponsableTécnico?: string;
  UserAprobacion?: string;
  CargoUserAprobacion?: string;
  FechaAprobacion?: string;
  Observaciones?: string;
  ManualDisponible?: boolean;
  PlanoDisponible?: boolean;
  RequiereCapacitacion?: boolean;
  Recomendaciones?: string;
  Foto?: string;
}

export interface UpdateHVEquipoDto extends Partial<CreateHVEquipoDto> {}

export interface HVEquipoFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  EstadoHV?: 'Guardada' | 'Aprobada';
  TipoEquipo?: string;
  UsoEquipo?: string;
  clienteId?: string;
}
