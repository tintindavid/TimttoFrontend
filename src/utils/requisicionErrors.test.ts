import { describe, expect, it } from 'vitest';
import { getRequisicionErrorMessage } from './requisicionErrors';

const err = (code: string) => ({ response: { data: { message: 'raw', error: { code } } } });

describe('getRequisicionErrorMessage', () => {
  it.each([
    ['NIVEL_NO_PENDIENTE', 'niveles pendientes'],
    [
      'APROBACION_BLOQUEARIA_NIVEL',
      'Aprobar ahora dejaría un nivel posterior sin aprobador disponible. Pide a un administrador que reasigne los aprobadores.',
    ],
    ['APROBADOR_INVALIDO', 'no es válido'],
    ['SEPARACION_FUNCIONES', 'No puedes aprobar'],
    ['ROL_SIN_PERMISO_APROBAR', 'rol'],
    ['APROBADOR_SIN_PERMISO', 'permiso'],
    ['VERSION_DESACTUALIZADA', 'Recarga'],
    ['CANTIDAD_EXCEDE', 'supera lo solicitado'],
    ['SOLICITUD_YA_VINCULADA', 'ya pertenece'],
    ['SOLICITUD_EN_REQUISICION', 'está en una requisición'],
    ['SOLICITUD_NO_DISPONIBLE', 'aún no está disponible'],
    ['REQUIERE_REQUISICION', 'debe pasar primero'],
  ])('maps %s to Spanish text', (code, fragment) => {
    const msg = getRequisicionErrorMessage(err(code));
    expect(msg).toContain(fragment);
    expect(msg).not.toBe('raw');
  });

  it('no longer maps the guessed NIVEL_NO_REASIGNABLE code', () => {
    expect(getRequisicionErrorMessage(err('NIVEL_NO_REASIGNABLE'))).toBe('raw');
  });
});
