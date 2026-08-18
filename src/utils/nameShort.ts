export interface NameShortInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

/**
 * Formats a user's display name as "M. Duran" — first-name initial + first
 * word of the last name. Mirrors the backend `nameShort.util.js`
 * (ot-responsables-programacion-trazable, design.md D8) so the panel can
 * render the same short form without waiting on a `snapshotName` from the
 * server (e.g. for the "Responsable(s)" column and the multi-select label).
 *
 * Rules:
 *   - `{ firstName: 'Martin', lastName: 'Duran' }` -> "M. Duran"
 *   - Compound last names use only the first word: `{ firstName: 'Martin',
 *     lastName: 'Duran Martinez' }` -> "M. Duran"
 *   - Missing `firstName` falls back to the local-part of `email`:
 *     `{ email: 'jdoe@timtto.com' }` -> "jdoe"
 *   - Nothing usable at all -> "?"
 *
 * NOTE: for entries already persisted in `programaciones[]`, prefer the
 * frozen `snapshotName` on the entry over recomputing this — the snapshot is
 * the source of truth for historical auditability (D8 trade-off: a user's
 * name change does not propagate to past entries).
 */
export function nameShort(user?: NameShortInput | null): string {
  const first = typeof user?.firstName === 'string' ? user.firstName.trim() : '';
  const last = typeof user?.lastName === 'string' ? user.lastName.trim() : '';

  if (first) {
    const initial = first.charAt(0).toUpperCase();
    if (last) {
      const lastFirstWord = last.split(/\s+/)[0];
      return `${initial}. ${lastFirstWord}`;
    }
    return `${initial}.`;
  }

  if (typeof user?.email === 'string' && user.email.trim()) {
    const local = user.email.trim().split('@')[0];
    if (local) return local;
  }

  return '?';
}

export default nameShort;
