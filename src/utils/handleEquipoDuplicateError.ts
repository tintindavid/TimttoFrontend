import { AxiosError, isAxiosError } from 'axios';
import { EquipoItem } from '@/types/equipoItem.types';

interface EquipoDuplicateErrorBody {
  success: false;
  error: {
    status?: number;
    code: string;
    message?: string;
    details?: { existing?: EquipoItem };
  };
}

export type EquipoDuplicateCheckResult =
  | { isDuplicate: true; existing: EquipoItem }
  | { isDuplicate: false };

/**
 * Narrows an unknown error thrown by an equipo create/update call into a
 * duplicate-detection result. Only axios errors with HTTP 409 and
 * `error.code === 'EQUIPO_DUPLICATE'` are treated as duplicates; everything
 * else (network errors, other 4xx/5xx, non-axios errors) returns
 * `{ isDuplicate: false }` so callers fall back to their normal error path.
 */
export function handleEquipoDuplicateError(error: unknown): EquipoDuplicateCheckResult {
  if (!isAxiosError(error)) {
    return { isDuplicate: false };
  }

  const axiosError = error as AxiosError<EquipoDuplicateErrorBody>;
  const status = axiosError.response?.status;
  const body = axiosError.response?.data;

  if (status === 409 && body?.error?.code === 'EQUIPO_DUPLICATE' && body.error.details?.existing) {
    return { isDuplicate: true, existing: body.error.details.existing };
  }

  return { isDuplicate: false };
}

export default handleEquipoDuplicateError;
