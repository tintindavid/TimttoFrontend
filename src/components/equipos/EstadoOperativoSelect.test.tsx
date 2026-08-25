import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EstadoOperativoSelect from './EstadoOperativoSelect';
import { EstadoOperativoValues } from '@/constants/estadoOperativo';

describe('EstadoOperativoSelect', () => {
  it('renders all 5 enum options', () => {
    render(<EstadoOperativoSelect value="Operativo" onChange={vi.fn()} />);
    const select = screen.getByLabelText('Estado Operativo') as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual([...EstadoOperativoValues]);
  });

  it('emits onChange with the selected value', () => {
    const onChange = vi.fn();
    render(<EstadoOperativoSelect value="Operativo" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Estado Operativo'), {
      target: { value: 'En Reparacion' },
    });
    expect(onChange).toHaveBeenCalledWith('En Reparacion');
  });

  it('hides the motivo textarea when value equals currentValue', () => {
    render(
      <EstadoOperativoSelect
        value="Operativo"
        currentValue="Operativo"
        withMotivo
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('Motivo del cambio (opcional)')).not.toBeInTheDocument();
  });

  it('shows the motivo textarea when value differs from currentValue', () => {
    render(
      <EstadoOperativoSelect
        value="Fuera de Servicio"
        currentValue="Operativo"
        withMotivo
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Motivo del cambio (opcional)')).toBeInTheDocument();
  });

  it('does not show the motivo textarea when withMotivo is false, even on change', () => {
    render(
      <EstadoOperativoSelect
        value="Fuera de Servicio"
        currentValue="Operativo"
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('Motivo del cambio (opcional)')).not.toBeInTheDocument();
  });

  it('enforces the 500 char maxLength on the motivo textarea', () => {
    render(
      <EstadoOperativoSelect
        value="Fuera de Servicio"
        currentValue="Operativo"
        withMotivo
        motivo=""
        onMotivoChange={vi.fn()}
        onChange={vi.fn()}
      />
    );
    const textarea = screen.getByLabelText('Motivo del cambio (opcional)') as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(500);
  });

  it('emits onMotivoChange when typing in the textarea', () => {
    const onMotivoChange = vi.fn();
    render(
      <EstadoOperativoSelect
        value="Fuera de Servicio"
        currentValue="Operativo"
        withMotivo
        motivo=""
        onMotivoChange={onMotivoChange}
        onChange={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Motivo del cambio (opcional)'), {
      target: { value: 'Falla eléctrica' },
    });
    expect(onMotivoChange).toHaveBeenCalledWith('Falla eléctrica');
  });
});
