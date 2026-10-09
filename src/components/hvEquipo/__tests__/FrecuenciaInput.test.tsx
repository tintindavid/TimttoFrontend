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
});
