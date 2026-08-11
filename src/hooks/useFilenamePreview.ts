import { useMemo } from 'react';
import { PdfFilenameToken } from '@/constants/pdfReports.constants';

/**
 * Frontend mirror of `TimttoApp/src/utils/filenameSanitize.util.js`. Kept
 * duplicated on purpose to avoid pulling a shared package into a two-repo
 * project — the logic is small enough that behavioral drift is caught by
 * the modal preview vs. the actual downloaded ZIP being identical.
 */

const WINDOWS_RESERVED_CHARS_RE = /[<>:"/\\|?*]/g;
const COMBINING_DIACRITICS_RE = /[̀-ͯ]/g;
const WHITESPACE_UNDERSCORE_RUN_RE = /[\s_]+/g;
const LEADING_TRAILING_UNDERSCORE_RE = /^_+|_+$/g;

const MAX_LENGTH = 120;

function sanitize(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_RE, '')
    .replace(WINDOWS_RESERVED_CHARS_RE, '')
    .replace(WHITESPACE_UNDERSCORE_RUN_RE, '_')
    .replace(LEADING_TRAILING_UNDERSCORE_RE, '');
}

function formatDateYMD(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveTokenValue(report: any, token: PdfFilenameToken): string {
  const snap = report?.equipoSnapshot || {};
  switch (token) {
    case 'consecutivo':
      return report?.consecutivo || String(report?._id || 'SN');
    case 'serial':
      return snap.Serie || 'SN';
    case 'inventario':
      return snap.Inventario || 'SN';
    case 'item':
      return snap.ItemText || 'SN';
    case 'fecha': {
      const raw = report?.fechaProcesado || report?.fechaFinalizdo || report?.createdAt || null;
      return formatDateYMD(raw) || 'sin-fecha';
    }
    default:
      return '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildBulkPdfFilename(report: any, tokens: PdfFilenameToken[]): string | null {
  if (!Array.isArray(tokens) || tokens.length === 0) return null;
  const segments = tokens
    .map((t) => sanitize(resolveTokenValue(report, t)))
    .filter((s) => s.length > 0);
  if (segments.length === 0) return null;
  let name = segments.join('_');
  if (name.length > MAX_LENGTH) {
    name = name.slice(0, MAX_LENGTH).replace(LEADING_TRAILING_UNDERSCORE_RE, '');
  }
  return `${name}.pdf`;
}

/**
 * Live preview of the resulting per-file filename. When `sampleReport` is
 * null, uses placeholder values so the modal still shows an example on
 * empty sheets.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFilenamePreview(tokens: PdfFilenameToken[], sampleReport?: any | null): string {
  return useMemo(() => {
    if (tokens.length === 0) return '';
    const sample = sampleReport || {
      consecutivo: 'OT-XXXX-1',
      equipoSnapshot: { Serie: 'SN000', Inventario: 'INV-000', ItemText: 'MONITOR' },
      fechaProcesado: new Date().toISOString(),
    };
    return buildBulkPdfFilename(sample, tokens) || '';
  }, [tokens, sampleReport]);
}

export default useFilenamePreview;
