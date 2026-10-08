/**
 * Equipment QR types per
 * `openspec/changes/equipment-qr-public-history/specs/equipment-qrs/spec.md`.
 *
 * Mirrors the shape conventions of `serviceQr.types.ts` (sibling feature) and
 * `publicPortal.types.ts` (public whitelist DTO precedent, D5).
 */

import { EstadoOperativo } from '@/constants/estadoOperativo';

/** Admin-side QR record for a single `EquipoItem`. */
export interface EquipmentQr {
  _id: string;
  equipoId: string;
  qrToken: string;
  qrImageUrl?: string | null;
  /** `data:image/png;base64,...` populated by the backend, same pattern as `ServiceQr`. */
  qrImageDataUri?: string | null;
  active: boolean;
  isDeleted?: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * One row of the admin "QR Equipos" table. The backend `GET /api/equipment-qrs`
 * listing is equipo-centric (every equipo matching the filter shows up, with
 * or without an active QR yet) so the UI can drive bulk generation — NOT a
 * plain `EquipmentQr[]` listing of only-already-generated records. `qr` is
 * `null` when the equipo has no active QR.
 *
 * // reason: shape inferred from the UI requirements (D14 "QR actual (ícono
 * // si existe)" + bulk-generate needing to see equipos without QR yet) since
 * // the backend change ships in parallel; confirm against the real response
 * // once merged and adjust field names if they differ.
 */
export interface EquipmentQrListItem {
  equipoId: string;
  item?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  inventario?: string;
  ubicacion?: string;
  estadoOperativo?: EstadoOperativo | string;
  qr: EquipmentQr | null;
}

export interface EquipmentQrListResponse {
  data: EquipmentQrListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface EquipmentQrListFilters {
  ClienteId?: string;
  SedeId?: string;
  Servicio?: string;
  EstadoOperativo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Filter object shared between the listing and bulk-generate/export endpoints. */
export interface EquipmentQrBulkFilter {
  ClienteId?: string;
  SedeId?: string;
  Servicio?: string;
  EstadoOperativo?: string;
  search?: string;
}

export interface CreateEquipmentQrDto {
  equipoId: string;
}

export interface BulkGenerateEquipmentQrDto {
  filter: EquipmentQrBulkFilter;
  limit?: number;
}

export interface BulkGenerateEquipmentQrResponse {
  created: number;
  reused: number;
  items: EquipmentQr[];
}

/* ---------- Public (read-only, no auth) shapes — D5 whitelist ---------- */

/** One realized maintenance entry inside the cronograma timeline. */
export interface PublicMesMttoRealizado {
  mes: string | null;
  fecha?: string | null;
  consecutivo?: string | null;
}

export interface PublicEquipoSummary {
  item?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  inventario?: string;
  ubicacion?: string;
  estadoOperativo: EstadoOperativo | string;
  ultimoMtto?: string | null;
  proximoMtto?: string | null;
  /** Months the equipo is scheduled to receive maintenance (strings). */
  mesesMtto?: string[];
  /** Months already completed (fecha + consecutivo). */
  mesesMttoRealizados?: PublicMesMttoRealizado[];
}

export interface PublicClienteSummary {
  nombre: string;
  logoUrl?: string | null;
}

export interface PublicSedeSummary {
  nombre: string;
}

/** One card in the "Mtto" history tab — never carries user `_id` or email (D5). */
export interface PublicMaintenanceHistoryItem {
  _id: string;
  consecutivo?: string;
  fecha: string | null;
  tipoMtto?: string;
  responsable?: string;
  estadoOperativoFinal?: EstadoOperativo | string;
  tieneObservacion: boolean;
  observacionEstadoFinal?: string | null;
}

/** `GET /api/public/equipo/:qrToken` response body. */
export interface PublicEquipmentPayload {
  equipo: PublicEquipoSummary;
  cliente: PublicClienteSummary;
  sede?: PublicSedeSummary;
  historial: PublicMaintenanceHistoryItem[];
}
