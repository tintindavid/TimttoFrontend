import DOMPurify from 'dompurify';

/** Same allowlist as the backend `sanitizeRichText` (p, br, strong, b, em, i, u, h1-h3, ul, ol, li; no attributes). */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'];

/**
 * Sanitizes the editor HTML for the LIVE preview only. The PDF always uses the
 * server-sanitized value, so this is purely a display-side guard.
 */
export function sanitizeObservacionesForPreview(html: string): string {
  if (!html) return '';
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
  const text = clean.replace(/<[^>]*>/g, '').replace(/&nbsp;|[​-‍﻿\s]/g, '');
  return text ? clean : '';
}
