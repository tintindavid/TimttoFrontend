import { describe, it, expect } from 'vitest';
import { actividadesDeCelda, preventivosDeCelda, urlHttp } from './cronogramaResumenCelda';
import type { ActividadExterna, CadenaConActividades } from '@/types/actividadExterna.types';
import type { Reporte } from '@/types/reporte.types';

const actividad = (over: Partial<ActividadExterna>): ActividadExterna => ({
  _id: 'a1', tenantId: 't', clienteId: 'c', equipoId: 'e1', cadenaId: 'cad1', tipo: 'calibracion', consecutivoExterno: 'CAL-1',
  fecha: '2026-03-12T00:00:00.000Z', proveedor: 'Biolab', estadoFinal: 'aprobada', esInicioCadena: true, createdByUserId: 'u',
  createdAt: '', updatedAt: '', ...over,
} as ActividadExterna);

const grupo = (cadenaId: string, actividades: ActividadExterna[]): CadenaConActividades =>
  ({ cadena: { _id: cadenaId } as CadenaConActividades['cadena'], actividades });

const reporte = (over: Partial<Reporte>): Reporte => ({ _id: 'r1', tipoMtto: 'Preventivo', estado: 'Cerrado', fechaProcesado: '2026-03-12T12:00:00.000Z', ...over } as Reporte);

describe('actividadesDeCelda', () => {
  it('keeps the activities of that chain in that month and year, newest first', () => {
    const grupos = [
      grupo('cad1', [
        actividad({ _id: 'a1', fecha: '2026-03-02T00:00:00.000Z' }),
        actividad({ _id: 'a2', fecha: '2026-03-20T00:00:00.000Z' }),
        actividad({ _id: 'a3', fecha: '2025-03-12T00:00:00.000Z' }), // same month, other year
        actividad({ _id: 'a4', fecha: '2026-04-01T00:00:00.000Z' }), // other month
      ]),
      grupo('cad2', [actividad({ _id: 'a5', fecha: '2026-03-12T00:00:00.000Z' })]), // other chain
    ];
    expect(actividadesDeCelda(grupos, 'cad1', 'Mar', 2026).map((a) => a._id)).toEqual(['a2', 'a1']);
  });

  it('uses the UTC calendar day: the first and the last day of the month belong to that month', () => {
    const grupos = [grupo('cad1', [
      actividad({ _id: 'ini', fecha: '2026-03-01T00:00:00.000Z' }),
      actividad({ _id: 'fin', fecha: '2026-03-31T00:00:00.000Z' }),
      actividad({ _id: 'otro', fecha: '2026-04-01T00:00:00.000Z' }),
    ])];
    expect(actividadesDeCelda(grupos, 'cad1', 'Mar', 2026).map((a) => a._id).sort()).toEqual(['fin', 'ini']);
  });

  it('returns nothing for an unknown chain, no data or an invalid date', () => {
    expect(actividadesDeCelda(undefined, 'cad1', 'Mar', 2026)).toEqual([]);
    expect(actividadesDeCelda([grupo('cad1', [])], 'cadX', 'Mar', 2026)).toEqual([]);
    expect(actividadesDeCelda([grupo('cad1', [actividad({ fecha: 'no-es-fecha' })])], 'cad1', 'Mar', 2026)).toEqual([]);
  });
});

describe('preventivosDeCelda', () => {
  it('keeps closed or processed preventive reports of that month and year, internal and external', () => {
    const lista = [
      reporte({ _id: 'int', estado: 'Procesado' }),
      reporte({ _id: 'ext', origen: 'externo', estado: 'Cerrado', fechaProcesado: '2026-03-30T12:00:00.000Z' }),
      reporte({ _id: 'pend', estado: 'Pendiente' }),
      reporte({ _id: 'mc', tipoMtto: 'Correctivo' }),
      reporte({ _id: 'otroAnio', fechaProcesado: '2025-03-12T12:00:00.000Z' }),
      reporte({ _id: 'otroMes', fechaProcesado: '2026-05-12T12:00:00.000Z' }),
    ];
    expect(preventivosDeCelda(lista, 'Mar', 2026).map((r) => r._id)).toEqual(['ext', 'int']);
  });

  it('falls back to the finish date and tolerates no data', () => {
    expect(preventivosDeCelda([reporte({ _id: 'x', fechaProcesado: undefined, fechaFinalizdo: '2026-03-12T10:00:00.000Z' })], 'Mar', 2026)).toHaveLength(1);
    expect(preventivosDeCelda(undefined, 'Mar', 2026)).toEqual([]);
  });
});

describe('urlHttp', () => {
  it('only http(s) addresses survive', () => {
    expect(urlHttp('https://a.example/x.pdf')).toBe('https://a.example/x.pdf');
    expect(urlHttp('HTTP://a.example')).toBe('HTTP://a.example');
    expect(urlHttp('javascript:alert(1)')).toBeNull();
    expect(urlHttp('data:text/html,x')).toBeNull();
    expect(urlHttp('ftp://a.example')).toBeNull();
    expect(urlHttp(undefined)).toBeNull();
    expect(urlHttp('')).toBeNull();
  });
});
