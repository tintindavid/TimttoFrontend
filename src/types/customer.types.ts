/** Third-party kind. Legacy documents without the field are clients. */
export type CustomerKind = 'customer' | 'provider';

/** Filter accepted by GET /customers. Omitted means clients only (backend default). */
export type CustomerKindFilter = CustomerKind | 'all';

export interface CustomerListParams {
  kind?: CustomerKindFilter;
  page?: number;
  limit?: number;
  razonSocial?: string;
  ciudad?: string;
  nit?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  // reason: other consumers pass ad-hoc filters (search, status, ...) that the backend DTO accepts
  [key: string]: unknown;
}

export interface Customer {
  _id?: string;
  kind?: CustomerKind;
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
  correousados?: string[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  kind?: CustomerKind;
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
