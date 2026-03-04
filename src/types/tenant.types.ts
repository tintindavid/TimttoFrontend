export interface Tenant {
  _id?: string;
  id?: string;
  tenantId?: string;
  name: string;
  slug?: string;
  nit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  website?: string;
  logoUrl?: string;
  ownerId?: string;
  plan?: string;
  status?: string;
  active?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  contact?: {
    email?: string | null;
    phone?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTenantDto {
  name: string;
  slug?: string;
  email?: string;
  telefono?: string;
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {}
