/**
 * Serial normalization utilities — mirrors `TimttoApp/src/utils/serial.util.js`.
 *
 * Both implementations MUST stay identical. They are covered by the shared
 * fixture set `ai-specs/fixtures/serial-normalize.fixtures.json` (copied into
 * `src/utils/__fixtures__/serial-normalize.fixtures.json` for this stack —
 * see that file's header comment for the canonical source).
 */

/**
 * Normalizes a raw serial value for comparison purposes only.
 * Trims leading/trailing whitespace, collapses internal whitespace runs to a
 * single ASCII space, and converts to upper case. Non-string input is
 * coerced to an empty string.
 */
export function normalizeSerial(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * A normalized serial is "digit-bearing" when it contains at least one
 * Unicode digit. Purely alphabetic / symbolic placeholders ("N/V", "No
 * tiene", "SIN SERIE", etc.) are not digit-bearing.
 */
export function serialHasDigit(normalized: string): boolean {
  return /\d/.test(normalized);
}
