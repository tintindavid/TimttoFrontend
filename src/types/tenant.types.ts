export interface Tenant {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  email?: string;
  telefono?: string;
  active?: boolean;
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
