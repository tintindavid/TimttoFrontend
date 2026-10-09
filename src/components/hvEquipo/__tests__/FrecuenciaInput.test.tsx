import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FrecuenciaInput from '../FrecuenciaInput';

describe('FrecuenciaInput', () => {
  it('al elegir "única" setea esUnica=true', () => {
    const onChange = vi.fn();
    render(<FrecuenciaInput value={{ esUnica: false, meses: 12 }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/única/i));
    expect(onChange).toHaveBeenCalledWith({ esUnica: true });
  });

  it('oculta el input de meses cuando es única', () => {
    render(<FrecuenciaInput value={{ esUnica: true }} onChange={vi.fn()} />);
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it.each([[''], ['0'], ['-3']])('meses="%s" muestra error y emite meses undefined', (raw) => {
    const onChange = vi.fn();
    render(<FrecuenciaInput value={{ esUnica: false, meses: 12 }} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: raw } });
    expect(onChange).toHaveBeenCalledWith({ esUnica: false, meses: undefined });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('meses="1.5" se trunca a 1', () => {
    const onChange = vi.fn();
    render(<FrecuenciaInput value={{ esUnica: false, meses: 12 }} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1.5' } });
    expect(onChange).toHaveBeenCalledWith({ esUnica: false, meses: 1 });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
