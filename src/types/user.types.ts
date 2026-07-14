// 'superadmin' added in E1 (saas-platform-tenant-lifecycle); lives in tenantId='__platform__'
export type UserRole = 'superadmin' | 'admin' | 'technician' | 'user';

export type TipoContrato =
  | 'Indefinido'
  | 'Fijo'
  | 'Prestacion de servicios'
  | 'Obra o labor'
  | 'Aprendizaje'
  | 'Practicas'
  | 'Temporal'
  | '';

export const TIPO_CONTRATO_OPTIONS: TipoContrato[] = [
  'Indefinido',
  'Fijo',
  'Prestacion de servicios',
  'Obra o labor',
  'Aprendizaje',
  'Practicas',
  'Temporal',
];

export interface User {
  _id?: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email: string;
  role: UserRole;
  roleId?: string | null;
  // Effective RBAC permissions: hydrated by GET /auth/me from the user's role.
  // Empty for users with no roleId assigned. superadmin bypasses RBAC entirely.
  permissions?: string[];
  phone?: string;
  city?: string;
  registroInvima?: string;
  photo?: string;
  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;
  tipoContrato?: TipoContrato;
  salario?: number | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  fileFirma: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: UserRole;
  roleId?: string | null;
  tenantId?: string;
  phone?: string;
  city?: string;
  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;
  tipoContrato?: TipoContrato;
  salario?: number | null;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  roleId?: string | null;
  phone?: string;
  city?: string;
  fechaNacimiento?: string | null;
  fechaIngreso?: string | null;
  tipoContrato?: TipoContrato;
  salario?: number | null;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  city?: string;
  registroInvima?: string;
}

export interface UpdateSignatureDto {
  signatureData: string;
}
