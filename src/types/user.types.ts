export type UserRole = 'admin' | 'technician' | 'user';

export interface User {
  _id?: string;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  registroInvima?: string;
  photo?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  fileFirma: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  tenantId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  city?: string;
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
