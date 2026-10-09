import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActividadesExternasList from '../ActividadesExternasList';
import type { CadenaConActividades } from '@/types/actividadExterna.types';

const grupo: CadenaConActividades = {
  cadena: { _id: 'c1', tenantId: 't1', clienteId: 'cli1', equipoId: 'eq1', tipo: 'calibracion', esUnica: false, estado: 'vigente', frecuenciaMeses: 12, fechaProxima: '2999-01-15', createdAt: '', updatedAt: '' },
  actividades: [{ _id: 'a1', tenantId: 't1', clienteId: 'cli1', equipoId: 'eq1', cadenaId: 'c1', tipo: 'calibracion', consecutivoExterno: 'CAL-1', fecha: '2026-01-15', proveedor: 'ACME', estadoFinal: 'aprobada', esInicioCadena: true, createdByUserId: 'u1', createdAt: '', updatedAt: '' }],
};

const noop = () => {};

describe('ActividadesExternasList', () => {
  it('renderiza un header de cadena por grupo', () => {
    render(<ActividadesExternasList grupos={[grupo]} onCerrarCadena={noop} onRemoveActividad={noop} />);
    expect(screen.getByText(/Calibración/i)).toBeInTheDocument();
    expect(screen.getByText(/vigente/i)).toBeInTheDocument();
  });

  it('muestra badge "vencida" cuando fechaProxima < hoy', () => {
    const vencido = { ...grupo, cadena: { ...grupo.cadena, fechaProxima: '2020-01-01' } };
    render(<ActividadesExternasList grupos={[vencido]} onCerrarCadena={noop} onRemoveActividad={noop} />);
    expect(screen.getByText(/vencida/i)).toBeInTheDocument();
  });

  it('vacío muestra CTA', () => {
    render(<ActividadesExternasList grupos={[]} onCerrarCadena={noop} onRemoveActividad={noop} />);
    expect(screen.getByText(/No hay actividades/i)).toBeInTheDocument();
    expect(screen.getByText(/Agregar actividad/i)).toBeInTheDocument();
  });

  it('no renderiza href para enlaces no http(s)', () => {
    const malo = { ...grupo, actividades: [{ ...grupo.actividades[0], enlace: 'javascript:alert(1)' }] };
    render(<ActividadesExternasList grupos={[malo]} onCerrarCadena={noop} onRemoveActividad={noop} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renderiza enlace http(s) con target _blank', () => {
    const ok = { ...grupo, actividades: [{ ...grupo.actividades[0], enlace: 'https://example.com/x' }] };
    render(<ActividadesExternasList grupos={[ok]} onCerrarCadena={noop} onRemoveActividad={noop} />);
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('href', 'https://example.com/x');
    expect(a).toHaveAttribute('target', '_blank');
  });

  it('Eliminar solo visible si cerradaAt es nulo y dispara callback', () => {
    const onRemove = vi.fn();
    const cerrada = { ...grupo.actividades[0], _id: 'a2', cerradaAt: '2026-02-01' };
    render(<ActividadesExternasList grupos={[{ ...grupo, actividades: [grupo.actividades[0], cerrada] }]} onCerrarCadena={noop} onRemoveActividad={onRemove} />);
    const btns = screen.getAllByRole('button', { name: /Eliminar/i });
    expect(btns).toHaveLength(1);
    fireEvent.click(btns[0]);
    expect(onRemove).toHaveBeenCalledWith('a1');
  });

  it('botón cerrar cadena solo en cadenas vigentes', () => {
    const onCerrar = vi.fn();
    const { rerender } = render(<ActividadesExternasList grupos={[grupo]} onCerrarCadena={onCerrar} onRemoveActividad={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /Cerrar cadena manualmente/i }));
    expect(onCerrar).toHaveBeenCalledWith('c1');
    rerender(<ActividadesExternasList grupos={[{ ...grupo, cadena: { ...grupo.cadena, estado: 'cerrada_manualmente' } }]} onCerrarCadena={onCerrar} onRemoveActividad={noop} />);
    expect(screen.queryByRole('button', { name: /Cerrar cadena manualmente/i })).toBeNull();
  });
});
