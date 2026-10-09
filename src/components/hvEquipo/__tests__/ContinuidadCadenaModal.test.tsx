import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContinuidadCadenaModal from '../ContinuidadCadenaModal';
import type { CadenaActividad, CreateActividadDto } from '@/types/actividadExterna.types';

const cadena = (over: Partial<CadenaActividad> = {}): CadenaActividad => ({
  _id: 'cad1', tenantId: 't1', clienteId: 'cli1', equipoId: 'eq1',
  tipo: 'calibracion', esUnica: false, estado: 'vigente', frecuenciaMeses: 12,
  fechaProxima: '2027-01-15', createdAt: '2026-01-15', updatedAt: '2026-01-15', ...over,
});
const datos = (): CreateActividadDto => ({
  tipo: 'calibracion', consecutivoExterno: 'X', fecha: '2027-01-20', proveedor: 'ACME', estadoFinal: 'aprobada',
  frecuencia: { meses: 12, esUnica: false },
});

describe('ContinuidadCadenaModal', () => {
  it('muestra todas las cadenas candidatas + opción "nueva cadena"', () => {
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena(), cadena({ _id: 'cad2' })]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    expect(screen.getAllByRole('radio').length).toBe(3);
    expect(screen.getByText(/cadena nueva/i)).toBeInTheDocument();
  });

  it('al seleccionar "nueva cadena" y confirmar llama onConfirm sin id', () => {
    const onConfirm = vi.fn();
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText(/cadena nueva/i));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('al seleccionar una cadena con frecuencia distinta muestra banner de alerta', () => {
    const dto = datos(); dto.frecuencia = { meses: 24, esUnica: false };
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena({ frecuenciaMeses: 12 })]} datosPaso1={dto} onBack={() => {}} onConfirm={() => {}} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.getByText(/no coincide/i)).toBeInTheDocument();
  });

  it('al pulsar Atrás llama onBack', () => {
    const onBack = vi.fn();
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={onBack} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Atrás/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it('al elegir una cadena vigente y confirmar llama onConfirm con su id', () => {
    const onConfirm = vi.fn();
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    expect(onConfirm).toHaveBeenCalledWith('cad1');
  });

  it('Confirmar está deshabilitado sin selección', () => {
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled();
  });

  it('muestra la caja informativa al elegir una cadena vigente', () => {
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByText(/quedará cerrada/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.getByText(/quedará cerrada/i)).toBeInTheDocument();
  });

  it('no muestra el banner cuando la frecuencia coincide', () => {
    render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena({ frecuenciaMeses: 12 })]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.queryByText(/no coincide/i)).not.toBeInTheDocument();
  });

  it('reinicia la selección y deshabilita Confirmar si la cadena ya no es candidata', () => {
    const { rerender } = render(<ContinuidadCadenaModal show cadenasCandidatas={[cadena()]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    rerender(<ContinuidadCadenaModal show cadenasCandidatas={[cadena({ _id: 'otra' })]} datosPaso1={datos()} onBack={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled();
  });
});
