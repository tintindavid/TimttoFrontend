/**
 * Helper for the public ticket app session lifecycle.
 *
 * Per design.md §D7 / §D8 the public app uses `sessionStorage` (never
 * `localStorage`, never cookies) and is isolated from the panel auth.
 *
 * Keys:
 *  - `timtto.public.sessionToken` — JWT-like session token issued by the
 *    backend after a successful `POST /public/tickets/validate-access`.
 *  - `timtto.public.qrMeta` — JSON snapshot of the QR metadata returned by
 *    the same endpoint (cliente / sede / servicio names) so the dashboard
 *    can show the context without an extra round-trip.
 *  - `timtto.public.qrToken` — the raw qrToken used to login (kept for
 *    re-validation / refresh flows).
 */

import {
  PUBLIC_SESSION_QR_TOKEN_KEY,
  PUBLIC_SESSION_STORAGE_KEY,
} from '@/constants/ticket.constants';

const QR_META_KEY = 'timtto.public.qrMeta';

export interface PublicQrMeta {
  servicio: { id: string; name: string };
  sede: { id: string; name: string };
  cliente: { id: string; name: string };
}

export const publicSession = {
  getToken(): string | null {
    return sessionStorage.getItem(PUBLIC_SESSION_STORAGE_KEY);
  },
  setToken(token: string): void {
    sessionStorage.setItem(PUBLIC_SESSION_STORAGE_KEY, token);
  },

  getQrToken(): string | null {
    return sessionStorage.getItem(PUBLIC_SESSION_QR_TOKEN_KEY);
  },
  setQrToken(qrToken: string): void {
    sessionStorage.setItem(PUBLIC_SESSION_QR_TOKEN_KEY, qrToken);
  },

  getMeta(): PublicQrMeta | null {
    const raw = sessionStorage.getItem(QR_META_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicQrMeta;
    } catch {
      return null;
    }
  },
  setMeta(meta: PublicQrMeta): void {
    sessionStorage.setItem(QR_META_KEY, JSON.stringify(meta));
  },

  clear(): void {
    sessionStorage.removeItem(PUBLIC_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(PUBLIC_SESSION_QR_TOKEN_KEY);
    sessionStorage.removeItem(QR_META_KEY);
  },
};

export default publicSession;
