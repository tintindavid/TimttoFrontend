export interface Sede {
  _id?: string;
  Cliente?: string; // Customer ID
  contact?: string;
  departamento?: string;
  nombreSede: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSedeDto {
  Cliente: string; // Required Customer ID
  nombreSede: string;
  contact?: string;
  departamento?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
}

export interface UpdateSedeDto {
  nombreSede?: string;
  contact?: string;
  departamento?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
}