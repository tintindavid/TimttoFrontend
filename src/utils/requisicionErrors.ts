import {
  REGLA_CONFLICTO_LABELS,
  REQUISICION_ERROR_MESSAGES,
  type ReglaConflictoTipo,
} from '@/types/requisicion.types';

interface ApiErrorLike {
  response?: {
    data?: { message?: string; error?: { code?: string; details?: { conflicts?: Array<{ tipo?: string; orden?: number }> } } };
  };
}

/** Returns the backend error code of an axios error, if any. */
export const getApiErrorCode = (err: unknown): string | undefined =>
  (err as ApiErrorLike)?.response?.data?.error?.code;

/** User-facing Spanish message for a requisiciones API error (known code, then backend message, then fallback). */
export const getRequisicionErrorMessage = (
  err: unknown,
  fallback = 'Ocurrió un error. Inténtalo de nuevo.'
): string => {
  const code = getApiErrorCode(err);
  if (code && REQUISICION_ERROR_MESSAGES[code]) return REQUISICION_ERROR_MESSAGES[code];
  return (err as ApiErrorLike)?.response?.data?.message || fallback;
};

/** Spanish lines describing the conflicts of a 400 REGLAS_INCONSISTENTES (empty for any other error). */
export const getReglaConflictMessages = (err: unknown): string[] => {
  if (getApiErrorCode(err) !== 'REGLAS_INCONSISTENTES') return [];
  const conflicts = (err as ApiErrorLike)?.response?.data?.error?.details?.conflicts ?? [];
  const lines = conflicts.map((c) => {
    const base = REGLA_CONFLICTO_LABELS[c.tipo as ReglaConflictoTipo] ?? 'Conflicto con otro nivel.';
    return c.orden !== undefined ? `${base} (nivel ${c.orden})` : base;
  });
  return Array.from(new Set(lines));
};
