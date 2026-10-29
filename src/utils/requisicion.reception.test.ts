import { describe, expect, it } from 'vitest';
import type { RequisicionLinea } from '@/types/requisicion.types';
import { canCerrarLinea, cantidadPendienteRecepcion, lineaResponsableId } from './requisicion.utils';

const linea = (over: Partial<RequisicionLinea> = {}): RequisicionLinea => ({
  _id: 'l1',
  descripcion: 'Rodamiento',
  unidad: 'und',
  cantidadSolicitada: 5,
  precioEstimado: 10,
  ...over,
});

describe('cantidadPendienteRecepcion', () => {
  it('is what is still to receive', () => {
    expect(cantidadPendienteRecepcion(linea())).toBe(5);
    expect(cantidadPendienteRecepcion(linea({ estadoLinea: 'Recibida_Parcial', cantidadRecibida: 2 }))).toBe(3);
    expect(cantidadPendienteRecepcion(linea({ estadoLinea: 'Recibida', cantidadRecibida: 5 }))).toBe(0);
  });
  it('is zero for final states and re-opens up to the unconfirmed amount for a dispute', () => {
    expect(cantidadPendienteRecepcion(linea({ estadoLinea: 'Confirmada', cantidadRecibida: 1 }))).toBe(0);
    expect(cantidadPendienteRecepcion(linea({ estadoLinea: 'Cancelada' }))).toBe(0);
    expect(cantidadPendienteRecepcion(linea({ estadoLinea: 'En_Disputa', cantidadRecibida: 5, cantidadConfirmada: 3 }))).toBe(2);
  });
});

describe('canCerrarLinea / lineaResponsableId', () => {
  it('only open lines can be closed with shortfall', () => {
    ['Pendiente', 'Recibida_Parcial', 'En_Disputa'].forEach((e) => expect(canCerrarLinea(linea({ estadoLinea: e }))).toBe(true));
    ['Recibida', 'Confirmada', 'Cancelada'].forEach((e) => expect(canCerrarLinea(linea({ estadoLinea: e }))).toBe(false));
    expect(canCerrarLinea(linea())).toBe(true);
  });
  it('prefers the request responsible and falls back to the requester, then the creator', () => {
    const req = { solicitanteId: 'sol', creadaPor: 'cre' };
    expect(lineaResponsableId(linea({ origenSolicitudRepuestoId: { _id: 'x', ResponsableSolicitud: { _id: 'resp' } } }), req)).toBe('resp');
    expect(lineaResponsableId(linea({ origenSolicitudRepuestoId: 'plain-id' }), req)).toBe('sol');
    expect(lineaResponsableId(linea(), { solicitanteId: undefined, creadaPor: 'cre' })).toBe('cre');
  });
});
