import { describe, expect, it } from 'vitest';
import { EVENT_META, actorName, getEventMeta, userRefName } from './requisicion.utils';

describe('deleted users and timeline events', () => {
  it('renders a neutral label for soft-deleted users (bare id, null or placeholder object)', () => {
    expect(userRefName('507f1f77bcf86cd799439011')).toBe('Usuario eliminado');
    expect(userRefName(null)).toBe('Usuario eliminado');
    expect(userRefName({ _id: 'u', firstName: 'Usuario', lastName: 'eliminado' })).toBe('Usuario eliminado');
    expect(actorName({ tipo: 'usuario', usuarioId: 'gone' } as never)).toBe('Usuario eliminado');
  });

  it('labels every backend timeline event', () => {
    const events = [
      'CREADA', 'EDITADA', 'ENVIADA', 'APROBACION_SOLICITADA', 'NIVEL_APROBADO', 'NIVEL_RECHAZADO', 'APROBADA',
      'RECHAZADA', 'RETIRADA', 'REABIERTA', 'CANCELADA', 'APROBADORES_REASIGNADOS', 'ELIMINADA',
    ];
    events.forEach((e) => {
      expect(EVENT_META[e], e).toBeDefined();
      expect(getEventMeta(e).label).not.toBe(e);
    });
    expect(getEventMeta('APROBADORES_REASIGNADOS').label).toBe('Aprobadores reasignados');
    expect(getEventMeta('ELIMINADA').label).toBe('Requisición eliminada');
  });
});
