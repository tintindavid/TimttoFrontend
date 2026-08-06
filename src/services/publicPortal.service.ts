import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types/api.types';
import {
  PortalConsolidatedView,
  PortalReportDetail,
  PortalSheetsResponse,
  PortalSignLateRequest,
  PortalSignLateResponse,
  PortalSignRequest,
  PortalSignResponse,
} from '@/types/publicPortal.types';

/**
 * Separate axios instance for the public client portal (`/portal/:token/*`),
 * mirroring `publicTicket.service.ts` (D7/D11 of the proposal): no panel
 * auth interceptor, no `Authorization` header at all — the opaque token
 * travels only in the URL path, resolved server-side by
 * `resolveClientToken` middleware.
 *
 * Base URL strips the `/api/v1` suffix so we hit `${origin}/public/client-view/...`
 * (backend mounts the public router at `/public/client-view`, registered
 * before the global auth middleware — D3).
 */

const RAW_API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api/v1';

const computePublicBase = (apiUrl: string): string => {
  const trimmed = apiUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed.slice(0, -'/api/v1'.length);
  }
  return trimmed;
};

const PUBLIC_BASE_URL = computePublicBase(RAW_API_URL);

const publicPortalApi: AxiosInstance = axios.create({
  baseURL: PUBLIC_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

class PublicPortalService {
  private endpoint = '/public/client-view';

  async getConsolidatedView(token: string): Promise<ApiResponse<PortalConsolidatedView>> {
    const res = await publicPortalApi.get<ApiResponse<PortalConsolidatedView>>(
      `${this.endpoint}/${token}`
    );
    return res.data;
  }

  async getReportDetail(
    token: string,
    reportId: string
  ): Promise<ApiResponse<PortalReportDetail>> {
    const res = await publicPortalApi.get<ApiResponse<PortalReportDetail>>(
      `${this.endpoint}/${token}/reports/${reportId}`
    );
    return res.data;
  }

  /** Marks a single report as reviewed by the client (D1). */
  async markReviewed(
    token: string,
    reportId: string
  ): Promise<ApiResponse<{ clientReview: { reviewedAt: string } }>> {
    const res = await publicPortalApi.post<ApiResponse<{ clientReview: { reviewedAt: string } }>>(
      `${this.endpoint}/${token}/reports/${reportId}/review`
    );
    return res.data;
  }

  /** Unmarks a report's review. Backend returns 204 (no body) — see D3 for the 409 gate. */
  async unmarkReviewed(token: string, reportId: string): Promise<void> {
    await publicPortalApi.delete(`${this.endpoint}/${token}/reports/${reportId}/review`);
  }

  /**
   * PUT semantics for the free-form client note (2026-08-02): empty string
   * clears the note ($unset on the backend), any other text replaces it.
   * Returns the updated `{ text, updatedAt } | null` payload.
   */
  async updateClientNote(
    token: string,
    reportId: string,
    text: string
  ): Promise<ApiResponse<{ clientNote: { text: string; updatedAt: string } | null }>> {
    const res = await publicPortalApi.put<
      ApiResponse<{ clientNote: { text: string; updatedAt: string } | null }>
    >(`${this.endpoint}/${token}/reports/${reportId}/note`, { text });
    return res.data;
  }

  /**
   * Creates N `SheetWork` for the reviewed subset (D6/D8). Stub for the
   * follow-up change's `SignatureModal` — kept here so types compile end to
   * end while that agent builds the UI.
   */
  async sign(token: string, body: PortalSignRequest): Promise<ApiResponse<PortalSignResponse>> {
    const res = await publicPortalApi.post<ApiResponse<PortalSignResponse>>(
      `${this.endpoint}/${token}/sign`,
      body
    );
    return res.data;
  }

  /** Lists the `SheetWork` history generated from the current token (D12). Stub, see `sign`. */
  async listSheets(token: string): Promise<ApiResponse<PortalSheetsResponse>> {
    const res = await publicPortalApi.get<ApiResponse<PortalSheetsResponse>>(
      `${this.endpoint}/${token}/sheets`
    );
    return res.data;
  }

  /**
   * Attaches a signature to a `SheetWork` created without one (empty
   * `firmaFile`) — `portal-signature-flow` D3/D7. Restricted server-side to
   * the token that originally created the sheet; a mismatched token gets a
   * 404 `SHEET_NOT_FOUND` (no existence leak), an already-signed sheet gets
   * 409 `SHEET_ALREADY_SIGNED`.
   */
  async signExistingSheet(
    token: string,
    sheetId: string,
    payload: PortalSignLateRequest
  ): Promise<ApiResponse<PortalSignLateResponse>> {
    const res = await publicPortalApi.post<ApiResponse<PortalSignLateResponse>>(
      `${this.endpoint}/${token}/sheets/${sheetId}/sign`,
      payload
    );
    return res.data;
  }

  /**
   * Builds the download URL for a signed sheet's PDF. Not fetched eagerly —
   * the caller renders it as an `<a href>` (or fetches as a blob) once
   * `pdfStatus === 'ready'`. Stub, see `sign`.
   */
  getSheetPdfUrl(token: string, sheetId: string): string {
    return `${PUBLIC_BASE_URL}${this.endpoint}/${token}/sheets/${sheetId}/pdf`;
  }

  /**
   * ZIP with one PDF per report of the signed sheet (2026-08-04). Backend
   * scopes by token+sheet ownership so a link leaked to another token/tenant
   * still 404s. Rendered as an `<a href download>` in the history table.
   */
  getSheetReportsZipUrl(token: string, sheetId: string): string {
    return `${PUBLIC_BASE_URL}${this.endpoint}/${token}/sheets/${sheetId}/reports-pdf`;
  }

  /**
   * URL of the HTML view of a single report — same document the client will
   * receive as PDF at handover. Feeds the `<iframe>` inside
   * `ReportDetailModal` so the visual matches the deliverable exactly.
   */
  getReportPdfViewUrl(token: string, reportId: string): string {
    return `${PUBLIC_BASE_URL}${this.endpoint}/${token}/reports/${reportId}/pdf-view`;
  }

  /**
   * Preview of the N HTs the client is about to sign, WITHOUT persisting
   * anything. Returns raw HTML that the caller embeds into an iframe's
   * `srcDoc`. Body mirrors the real sign payload; `imagePng` may be empty
   * so the client can preview the layout before actually drawing.
   */
  async previewSign(
    token: string,
    body: {
      reportIds: string[];
      signature: {
        imagePng?: string;
        signerName?: string;
        cargo?: string;
        observaciones?: string;
      };
    }
  ): Promise<string> {
    const res = await publicPortalApi.post<string>(
      `${this.endpoint}/${token}/sign-preview`,
      body,
      { responseType: 'text', headers: { Accept: 'text/html' } }
    );
    return res.data;
  }
}

export const publicPortalService = new PublicPortalService();
export { publicPortalApi };
export default publicPortalService;
