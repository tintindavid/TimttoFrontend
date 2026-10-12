import { describe, it, expect } from 'vitest';
import { TIPOS_ACTIVIDAD, ESTADOS_FINAL_LABELS, ERROR_CODE_MESSAGES } from '../actividadExterna';

describe('actividadExterna constants', () => {
  it('TIPOS_ACTIVIDAD incluye los 10 tipos de la spec', () => {
    const values = TIPOS_ACTIVIDAD.map(t => t.value);
    expect(values).toContain('calibracion');
    expect(values).toContain('otro');
    expect(values).toHaveLength(10);
  });

  it('ESTADOS_FINAL_LABELS cubre los 5 estados', () => {
    expect(Object.keys(ESTADOS_FINAL_LABELS)).toHaveLength(5);
  });

  it('ERROR_CODE_MESSAGES mapea todos los códigos de error del backend', () => {
    for (const code of [
      'CHAIN_NOT_VIGENTE', 'CHAIN_UNIQUE_NO_SUCCESSION', 'TYPE_MISMATCH',
      'TIPO_CUSTOM_REQUIRED', 'ESTADO_FINAL_CUSTOM_REQUIRED', 'FECHA_IN_FUTURE',
      'CANNOT_DELETE_HISTORICAL', 'FILE_TOO_LARGE', 'INVALID_FILE_TYPE',
      'FILE_CONTENT_MISMATCH', 'VALIDATION_ERROR', 'SUCCESSOR_CANNOT_BE_UNIQUE',
      'INCONSISTENT_STATE', 'FRECUENCIA_REQUIRED', 'NO_EVIDENCE', 'NOT_FOUND',
    ]) {
      expect(ERROR_CODE_MESSAGES[code]).toBeTruthy();
    }
  });
});
