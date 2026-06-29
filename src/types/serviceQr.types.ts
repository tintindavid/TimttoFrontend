/**
 * Service QR types per
 * `openspec/changes/add-ticket-area-module/specs/service-qrs/spec.md`.
 */

import { TicketClienteRef, TicketSedeRef, TicketServicioRef } from './ticket.types';

export interface ServiceQr {
  _id: string;
  tenantId: string;
  qrToken: string;
  qrImageUrl?: string | null;
  /**
   * `data:image/png;base64,...` populated by the backend on list/detail
   * responses. Avoids the auth-on-<img> issue and lets us embed the QR
   * directly into a printable PDF without an extra fetch.
   */
  qrImageDataUri?: string | null;

  ClienteId: string | TicketClienteRef;
  sedeId: string | TicketSedeRef;
  servicioId: string | TicketServicioRef;

  active: boolean;
  isDeleted?: boolean;
  passwordRotatedAt?: string | null;

  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateServiceQrDto {
  ClienteId: string;
  sedeId: string;
  servicioId: string;
  password: string;
}

export interface RotateServiceQrPasswordDto {
  newPassword: string;
}

/* ---------- Public auth shapes ---------- */

export interface PublicValidateAccessDto {
  qrToken: string;
  password: string;
}

export interface PublicSessionDescriptors {
  qrId: string;
  cliente: { id: string; name: string };
  sede: { id: string; name: string };
  servicio: { id: string; name: string };
}

export interface PublicValidateAccessResponse {
  sessionToken: string;
  qr: {
    servicio: { id: string; name: string };
    sede: { id: string; name: string };
    cliente: { id: string; name: string };
  };
}

export interface ServiceQrListFilters {
  active?: boolean;
  ClienteId?: string;
  sedeId?: string;
  servicioId?: string;
  page?: number;
  limit?: number;
  search?: string;
}
