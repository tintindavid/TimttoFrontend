import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { handleEquipoDuplicateError } from './handleEquipoDuplicateError';
import { EquipoItem } from '@/types/equipoItem.types';

const existing: EquipoItem = { _id: 'eq-1', Marca: 'Philips', Serie: 'A123' };

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
  } as any);
  return error;
}

describe('handleEquipoDuplicateError', () => {
  it('recognizes an axios 409 with EQUIPO_DUPLICATE and returns the existing equipo', () => {
    const error = makeAxiosError(409, {
      success: false,
      error: { code: 'EQUIPO_DUPLICATE', details: { existing } },
    });

    expect(handleEquipoDuplicateError(error)).toEqual({ isDuplicate: true, existing });
  });

  it('returns isDuplicate: false for a 500 error', () => {
    const error = makeAxiosError(500, { success: false, error: { code: 'INTERNAL_ERROR' } });
    expect(handleEquipoDuplicateError(error)).toEqual({ isDuplicate: false });
  });

  it('returns isDuplicate: false for a 409 with a different error code', () => {
    const error = makeAxiosError(409, { success: false, error: { code: 'SOME_OTHER_CONFLICT' } });
    expect(handleEquipoDuplicateError(error)).toEqual({ isDuplicate: false });
  });

  it('returns isDuplicate: false for a non-axios error', () => {
    expect(handleEquipoDuplicateError(new Error('boom'))).toEqual({ isDuplicate: false });
    expect(handleEquipoDuplicateError('not an error')).toEqual({ isDuplicate: false });
    expect(handleEquipoDuplicateError(undefined)).toEqual({ isDuplicate: false });
  });
});
