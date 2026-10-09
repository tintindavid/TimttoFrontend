import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EvidenciaInput from '../EvidenciaInput';

describe('EvidenciaInput', () => {
  it('al cambiar modo a "file" notifica el modo', () => {
    const onChange = vi.fn();
    render(<EvidenciaInput value={{ mode: 'none' }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Archivo adjunto/i));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'file' }));
  });

  it('rechaza archivo > 10 MB client-side', () => {
    const onChange = vi.fn();
    const { container } = render(<EvidenciaInput value={{ mode: 'file' }} onChange={onChange} />);
    const file = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/10 MB/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ file }));
  });

  it('rechaza tipos MIME no permitidos', () => {
    const onChange = vi.fn();
    const { container } = render(<EvidenciaInput value={{ mode: 'file' }} onChange={onChange} />);
    const file = new File(['x'], 'a.exe', { type: 'application/x-msdownload' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/no permitido/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
