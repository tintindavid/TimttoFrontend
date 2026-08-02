/**
 * Public client-portal read-only types per
 * `openspec/changes/client-portal-token-and-readonly/specs/client-portal-access/spec.md`
 * (Requirements: "Public consolidated read of OTs and reports",
 * "Public detailed read of a single report").
 *
 * These describe the payload of `/api/public/client-view/:token*` — a
 * privacy-reduced projection of `OT`/`Report`. Reuses the existing
 * `ActividadRealizada`, `Evidencia`, `VerificationParam` shapes from
 * `reporte.types.ts` since the backend keeps the same field names, only
 * omitting internal fields (D9).
 */

import { ActividadRealizada, Evidencia, VerificationParam } from './reporte.types';

export interface PortalTenantSummary {
  name: string;
  logoUrl?: string | null;
}

export interface PortalClienteSummary {
  name: string;
}

export interface PortalEquipoSnapshot {
  ItemText?: string;
  Marca?: string;
  Modelo?: string;
  Serie?: string;
  Inventario?: string;
  Ubicacion?: string;
  Sede?: string;
  Servicio?: string;
}

export type PortalReportEstado =
  | 'Pendiente'
  | 'En_Progreso'
  | 'Cerrado'
  | 'Cancelado'
  | 'Procesado';

/** Summary shape embedded in the consolidated listing, grouped under each OT. */
export interface PortalReportSummary {
  _id: string;
  consecutivo?: string;
  estado: PortalReportEstado;
  equipoSnapshot?: PortalEquipoSnapshot;
  fechaFinalizado?: string | null;
  /** Client review mark set via `POST/DELETE .../reports/:reportId/review` (D1). */
  clientReview: { reviewedAt: string } | null;
  /**
   * True when the report has been sheeted (has a SheetWork ref). Derived from
   * `Report.hojaDeTrabajo` on the backend whitelist mapper so the client can
   * disable review-toggle affordances without ever seeing the ref itself.
   * Optional for backwards compat while the backend rolls out.
   */
  isSheeted?: boolean;
  /**
   * Free-form note the client attached to this report from the portal
   * (2026-08-02). `null` when there's no note. Admin sees an icon on the
   * OT's report list when this is set.
   */
  clientNote?: { text: string; updatedAt: string } | null;
}

export interface PortalOt {
  _id: string;
  Consecutivo?: string;
  EstadoOt?: string;
  Avance?: number | string;
  reports: PortalReportSummary[];
}

/** `GET /api/public/client-view/:token` response body. */
export interface PortalConsolidatedView {
  tenant: PortalTenantSummary;
  cliente: PortalClienteSummary;
  ots: PortalOt[];
}

export type PortalEstadoOperativo =
  | 'Operativo'
  | 'Fuera de Servicio'
  | 'En Mantenimiento'
  | 'Espera de Repuestos'
  | 'En Reparacion';

/** `GET /public/client-view/:token/reports/:reportId` response body. */
export interface PortalReportDetail extends PortalReportSummary {
  fechaCreacion?: string | null;
  fechaProcesado?: string | null;
  fallaReportada?: string | null;
  diagnostico?: string | null;
  accionTomada?: string | null;
  observacion?: string | null;
  observacionEstadoFinal?: string | null;
  estadoOperativo?: PortalEstadoOperativo | null;
  actividadesRealizadas?: ActividadRealizada[];
  evidencias?: Evidencia[];
  verificationParam?: VerificationParam[];
}

/** Body of a 410 Gone response — the only data allowed to leak past revocation. */
export interface PortalRevokedResponse {
  error: 'token_revoked';
  revokedAt: string;
}

/** Body of a 404 response for unknown tokens. */
export interface PortalNotFoundResponse {
  error: 'token_not_found';
}

/**
 * Body of `POST /public/client-view/:token/sign` (D6/D10). Declared now for
 * the follow-up change's `SignatureModal` — this change only wires the
 * review toggle, not the signature flow itself.
 */
export interface PortalSignRequest {
  reportIds: string[];
  signature: {
    imagePng: string;
    signerName: string;
    /**
     * Optional (2026-08-02). Removed from the SignatureModal UI because the
     * backend never persisted it — kept in the type as optional so existing
     * DTO integrations that still send it don't break.
     */
    signerId?: string;
    cargo?: string;
    /**
     * Free-form notes captured at sign time. Persists as
     * `SheetWork.observaciones` and prints on the HT PDF (2026-08-02).
     */
    observaciones?: string;
  };
}

/** 202 response body of `POST /public/client-view/:token/sign` (D8). */
export interface PortalSignResponse {
  signedBatchId: string;
  sheetIds: string[];
  pdfStatus: 'pending';
}

/** A single `SheetWork` entry as exposed by `GET /public/client-view/:token/sheets` (D12). */
export interface PortalSheet {
  _id: string;
  numeroHoja: string;
  otId: string;
  otConsecutivo: string;
  signedAt: string;
  pdfStatus: 'pending' | 'ready' | 'error';
  pdfUrl: string | null;
}

/** `GET /public/client-view/:token/sheets` response body. */
export interface PortalSheetsResponse {
  sheets: PortalSheet[];
}
