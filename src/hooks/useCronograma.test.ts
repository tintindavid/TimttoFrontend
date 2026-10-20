import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCronograma } from './useCronograma';
import type { CronogramaActividadExterna } from '@/types/cronograma.types';
import type { EquipoItem } from '@/types/equipoItem.types';

const equipo = (id: string, mesesMtto?: string[]): EquipoItem => ({
  _id: id, Marca: 'GE', Modelo: 'M', Serie: `S-${id}`, ItemId: { _id: 'i', Nombre: `Equipo ${id}` },
  mesesMtto,
} as unknown as EquipoItem);

const cadena = (equipoId: string, over: Partial<CronogramaActividadExterna> = {}): CronogramaActividadExterna => ({
  cadenaId: `c-${equipoId}`, equipoId, clienteId: 'cli', tipo: 'calibracion', tipoCustom: null, frecuenciaMeses: 6,
  fechaProxima: '2026-03-10T00:00:00.000Z', meses: ['mar', 'sep'], realizadas: [], vencida: false, diasParaVencer: 20,
  proveedor: 'ACME', proveedorId: null,
  equipo: { nombre: 'x', marca: null, modelo: null, serie: null, inventario: null, ubicacion: null },
  cliente: null,
  ...over,
});

const equipos = [equipo('a', ['Mar', 'Jun']), equipo('b', undefined), equipo('c', ['Ene'])];
const cadenas = [
  cadena('a'),
  cadena('b', { meses: ['jun'], vencida: true, diasParaVencer: -5 }),
  cadena('c', { meses: ['dic'], diasParaVencer: 15 }),
];

describe('useCronograma with external activities', () => {
  it('attaches the chains of each equipment', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    const byId = Object.fromEntries(result.current.equiposFiltrados.map((e) => [e._id, e.cadenas?.length]));
    expect(byId).toEqual({ a: 1, b: 1, c: 1 });
  });

  it('keeps the previous behaviour without chains', () => {
    const { result } = renderHook(() => useCronograma(equipos));
    expect(result.current.equiposFiltrados).toHaveLength(3);
    expect(result.current.stats.equiposPorMes.Mar).toBe(1);
    expect(result.current.stats.externasVencidas).toBe(0);
    expect(result.current.stats.externasPorVencer).toBe(0);
  });

  it('origen "externo" lists only equipment with scheduled chains', () => {
    const { result } = renderHook(() => useCronograma([...equipos, equipo('d', ['Feb'])], cadenas));
    act(() => result.current.actualizarFiltros({ origen: 'externo' }));
    expect(result.current.equiposFiltrados.map((e) => e._id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('origen "preventivo" lists all equipment and ignores the chains in the statistics', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    act(() => result.current.actualizarFiltros({ origen: 'preventivo' }));
    expect(result.current.equiposFiltrados).toHaveLength(3);
    expect(result.current.stats.externasVencidas).toBe(0);
    expect(Object.values(result.current.stats.equiposPorMesExterno ?? {}).every((n) => n === 0)).toBe(true);
  });

  it('counts equipment per month by origin', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    const { equiposPorMes, equiposPorMesExterno } = result.current.stats;
    expect(equiposPorMes.Mar).toBe(1);
    expect(equiposPorMesExterno?.Mar).toBe(1);
    expect(equiposPorMesExterno?.Sep).toBe(1);
    expect(equiposPorMesExterno?.Jun).toBe(1);
    expect(equiposPorMesExterno?.Dic).toBe(1);
    expect(equiposPorMesExterno?.Ene).toBe(0);
  });

  it('counts overdue and due-soon chains', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    expect(result.current.stats.externasVencidas).toBe(1);
    // 20 days (a) and 15 days (c) are within 30; the overdue one is not counted as due soon
    expect(result.current.stats.externasPorVencer).toBe(2);
  });

  it('does not count a chain due beyond 30 days as due soon', () => {
    const { result } = renderHook(() => useCronograma([equipo('a')], [cadena('a', { diasParaVencer: 45 })]));
    expect(result.current.stats.externasPorVencer).toBe(0);
  });

  it('the months filter considers the origin: external months count with "externo"', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    act(() => result.current.actualizarFiltros({ meses: ['Dic'], origen: 'externo' }));
    expect(result.current.equiposFiltrados.map((e) => e._id)).toEqual(['c']);
    act(() => result.current.actualizarFiltros({ origen: 'preventivo' }));
    expect(result.current.equiposFiltrados).toHaveLength(0);
    act(() => result.current.actualizarFiltros({ origen: 'todos' }));
    expect(result.current.equiposFiltrados.map((e) => e._id)).toEqual(['c']);
  });

  it('"todos" combines preventive and external months for the months filter', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    act(() => result.current.actualizarFiltros({ meses: ['Mar', 'Jun'] }));
    expect(result.current.equiposFiltrados.map((e) => e._id).sort()).toEqual(['a']);
  });
});

describe('useCronograma statistics follow the Origen filter', () => {
  it('origen "externo" zeroes the preventive totals but keeps the external ones', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    expect(result.current.stats.equiposPorMes.Mar).toBe(1);
    act(() => result.current.actualizarFiltros({ origen: 'externo' }));
    expect(Object.values(result.current.stats.equiposPorMes).every((n) => n === 0)).toBe(true);
    expect(result.current.stats.equiposPorMesExterno?.Sep).toBe(1);
  });

  it('origen "preventivo" keeps the preventive totals', () => {
    const { result } = renderHook(() => useCronograma(equipos, cadenas));
    act(() => result.current.actualizarFiltros({ origen: 'preventivo' }));
    expect(result.current.stats.equiposPorMes.Mar).toBe(1);
  });
});
