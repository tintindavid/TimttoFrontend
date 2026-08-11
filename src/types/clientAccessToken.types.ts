/**
 * Client access token types per
 * `openspec/changes/client-portal-token-and-readonly/specs/client-portal-access/spec.md`.
 *
 * Admin-facing CRUD types for `/api/client-tokens`. The opaque `token` value
 * is only ever returned in full at creation time; subsequent list/get calls
 * still include it because the admin needs it to rebuild the public link,
 * but it is never sent from the public portal back to the admin API.
 */

export type ClientAccessTokenStatus = 'active' | 'revoked';

/** Minimal OT projection returned when `otIds` is populated (GET :id). */
export interface ClientAccessTokenOtSummary {
  _id: string;
  Consecutivo?: string;
  EstadoOt?: string;
  Avance?: number | string;
}

export interface ClientAccessTokenCreatedByRef {
  _id: string;
  fullName?: string;
}

export interface ClientAccessTokenEmailHistory {
  lastEmail?: string | null;
  lastSentAt?: string | null;
  lastSentBy?: string | null;
  sendCount?: number;
}

export interface ClientAccessToken {
  _id: string;
  tenantId: string;
  clienteId: string;
  /** Plain string ids on list responses; populated summaries on GET :id. */
  otIds: string[] | ClientAccessTokenOtSummary[];
  token: string;
  status: ClientAccessTokenStatus;
  accessCount: number;
  lastAccessedAt?: string | null;
  createdBy?: string | ClientAccessTokenCreatedByRef | null;
  emailHistory?: ClientAccessTokenEmailHistory;
  revokedAt?: string | null;
  revokedBy?: string | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientAccessTokenCreatePayload {
  clienteId: string;
  otIds: string[];
  /**
   * Optional (2026-08-03): user whose firma stamps every HT auto-generated
   * from this token when the client signs. Defaults to the caller on the
   * backend. Must be a user with `fileFirma`. Immutable after creation.
   */
  attributionUserId?: string;
}

/** Shape returned once by `POST /api/client-tokens` — the only time the raw token is guaranteed fresh. */
export interface ClientAccessTokenCreateResponse {
  id: string;
  token: string;
  url: string;
}

export interface ClientAccessTokenListFilters {
  clienteId?: string;
  status?: ClientAccessTokenStatus;
  page?: number;
  limit?: number;
}

export type ClientAccessTokenListResponse = ClientAccessToken[];
