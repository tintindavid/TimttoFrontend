export interface Customer {
  _id?: string;
  tenantId?: string;
  CustomerPK?: string;
  Razonsocial: string;
  Ciudad?: string;
  Departamento?: string;
  Email?: string;
  Nit?: number;
  Status?: string;
  field?: string;
  Address?: string;
  Direccion?: string;
  Logo?: string;
  StatusReason?: string;
  TelContacto?: string;
  UserContacto?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  Razonsocial: string;
  Ciudad?: string;
  Departamento?: string;
  Email?: string;
  Nit?: number;
  Direccion?: string;
  Logo?: string;
  TelContacto?: string;
  UserContacto?: string;
}

export interface UpdateCustomerDto {
  Razonsocial?: string;
  Ciudad?: string;
  Departamento?: string;
  Email?: string;
  Nit?: number;
  Direccion?: string;
  Logo?: string;
  TelContacto?: string;
  UserContacto?: string;
}
