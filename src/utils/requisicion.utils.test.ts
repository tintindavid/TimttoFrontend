import { describe, expect, it } from 'vitest';
import type { Requisicion } from '@/types/requisicion.types';
import type { User } from '@/types/user.types';
import {
  canActAsOwner,
  canDecideCurrentLevel,
  catalogName,
  isPreviousRound,
  userRefName,
  warningText,
  computeMontoTotal,
  findReglaConflicts,
  getNivelActual,
  getEventMeta,
  EVENT_META,
  actorName,
} from './requisicion.utils';

const baseReq = (over: Partial<Requisicion> = {}): Requisicion => ({
  _id: 'r1',
  consecutivo: 'REQ-2026-0001',
  titulo: 'Compra',
  tipoRequisicionId: 't1',
  areaId: 'a1',
  prioridad: 'Media',
  estado: 'En_Aprobacion',
  creadaPor: 'creator',
  solicitanteId: 'creator',
  lineas: [],
  montoEstimado: 100,
  version: 1,
  aprobacion: {
    nivelActual: 1,
    niveles: [
      { orden: 1, aprobadorTipo: 'jefe_area', aprobadorIds: ['boss'], estado: 'Pendiente' },
      { orden: 2, aprobadorTipo: 'rol', rolId: 'role-dir', aprobadorIds: [], estado: 'Pendiente' },
    ],
  },
  ...over,
});

const user = (over: Partial<User> = {}): User => ({ _id: 'boss', email: 'b@x.co', role: 'user', fileFirma: '', ...over });

describe('computeMontoTotal', () => {
  it('sums quantity x price rounded to 2 decimals and ignores invalid rows', () => {
    expect(
      computeMontoTotal([
        { cantidadSolicitada: 2, precioEstimado: 10.555 },
        { cantidadSolicitada: Number.NaN, precioEstimado: 5 },
      ])
    ).toBe(21.11);
  });
});

describe('getNivelActual', () => {
  it('returns the level matching nivelActual', () => {
    expect(getNivelActual(baseReq())?.orden).toBe(1);
  });

  it('falls back to the first pending level', () => {
    const req = baseReq({ aprobacion: { nivelActual: null, niveles: [{ orden: 3, aprobadorTipo: 'jefe_area', aprobadorIds: [], estado: 'Pendiente' }] } });
    expect(getNivelActual(req)?.orden).toBe(3);
  });
});

describe('canDecideCurrentLevel', () => {
  it('allows the listed approver of the current level', () => {
    expect(canDecideCurrentLevel(baseReq(), user())).toBe(true);
  });

  it('denies users not listed for the level', () => {
    expect(canDecideCurrentLevel(baseReq(), user({ _id: 'other' }))).toBe(false);
  });

  it('denies the creator even when listed (separation of duties)', () => {
    expect(canDecideCurrentLevel(baseReq({ creadaPor: 'boss' }), user())).toBe(false);
  });

  it('denies someone who already decided another level', () => {
    const req = baseReq({
      aprobacion: {
        nivelActual: 2,
        niveles: [
          { orden: 1, aprobadorTipo: 'jefe_area', aprobadorIds: ['boss'], estado: 'Aprobado', decididoPor: 'boss' },
          { orden: 2, aprobadorTipo: 'rol', rolId: 'role-dir', aprobadorIds: [], estado: 'Pendiente' },
        ],
      },
    });
    expect(canDecideCurrentLevel(req, user({ roleId: 'role-dir' }))).toBe(false);
  });

  it('matches a role level by the user role', () => {
    const req = baseReq({ aprobacion: { nivelActual: 2, niveles: baseReq().aprobacion!.niveles } });
    expect(canDecideCurrentLevel(req, user({ _id: 'dir', roleId: 'role-dir' }))).toBe(true);
  });

  it('denies when the requisicion is not in approval', () => {
    expect(canDecideCurrentLevel(baseReq({ estado: 'Aprobada' }), user())).toBe(false);
  });
});

describe('findReglaConflicts', () => {
  const others = [{ _id: 'r1', orden: 1, montoDesde: 0, montoHasta: 5_000_000 }];

  it('accepts a contiguous higher level', () => {
    expect(findReglaConflicts({ orden: 2, montoDesde: 5_000_000, montoHasta: null }, others)).toEqual([]);
  });

  it('detects overlap and duplicated order', () => {
    const tipos = findReglaConflicts({ orden: 1, montoDesde: 1_000_000, montoHasta: null }, others).map((c) => c.tipo);
    expect(tipos).toEqual(expect.arrayContaining(['ORDEN_DUPLICADO', 'TRASLAPE']));
  });

  it('detects an order inconsistent with the amount', () => {
    const tipos = findReglaConflicts({ orden: 0, montoDesde: 6_000_000, montoHasta: null }, others).map((c) => c.tipo);
    expect(tipos).toContain('ORDEN_INCONSISTENTE');
  });

  it('detects an invalid range', () => {
    const tipos = findReglaConflicts({ orden: 5, montoDesde: 10, montoHasta: 10 }, []).map((c) => c.tipo);
    expect(tipos).toEqual(['RANGO_INVALIDO']);
  });

  it('ignores the rule being edited', () => {
    expect(findReglaConflicts({ _id: 'r1', orden: 1, montoDesde: 0, montoHasta: 4_000_000 }, others)).toEqual([]);
  });
});

describe('canActAsOwner / isPreviousRound / warningText', () => {
  it('allows owner or manage-all, denies others', () => {
    expect(canActAsOwner(baseReq(), user({ _id: 'creator' }), false)).toBe(true);
    expect(canActAsOwner(baseReq(), user({ _id: 'other' }), false)).toBe(false);
    expect(canActAsOwner(baseReq(), user({ _id: 'other' }), true)).toBe(true);
  });

  it('treats the levels of a Borrador as a previous round', () => {
    expect(isPreviousRound({ estado: 'Borrador' })).toBe(true);
    expect(isPreviousRound({ estado: 'En_Aprobacion' })).toBe(false);
  });

  it('normalizes warnings', () => {
    expect(warningText('texto')).toBe('texto');
    expect(warningText({ mensaje: 'm' })).toBe('m');
    expect(warningText({ message: 'x' })).toBe('x');
    expect(warningText({ tipo: 'T', mensaje: 'm', nivelOrden: 3 })).toBe('Nivel 3: m');
  });
});

describe('populated references', () => {
  it('resolves names of populated users and catalogs', () => {
    expect(userRefName({ _id: 'u', firstName: 'Ana', lastName: 'Ruiz' })).toBe('Ana Ruiz');
    expect(catalogName({ _id: 'a', nombre: 'Compras' })).toBe('Compras');
  });
});
