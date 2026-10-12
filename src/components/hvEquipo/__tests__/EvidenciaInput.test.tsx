import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EvidenciaInput from '../EvidenciaInput';

const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement;

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
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    expect(screen.getByText(/10 MB/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ file }));
  });

  it('rechaza tipos MIME no permitidos', () => {
    const onChange = vi.fn();
    const { container } = render(<EvidenciaInput value={{ mode: 'file' }} onChange={onChange} />);
    const file = new File(['x'], 'a.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    expect(screen.getByText(/no permitido/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ mode: 'file' });
  });

  it('archivo rechazado limpia el file previo del padre', () => {
    const onChange = vi.fn();
    const prev = new File(['x'], 'ok.pdf', { type: 'application/pdf' });
    const { container } = render(
      <EvidenciaInput value={{ mode: 'file', file: prev }} onChange={onChange} />,
    );
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput(container), { target: { files: [big] } });
    expect(onChange).toHaveBeenCalledWith({ mode: 'file' });
  });

  it('acepta DOCX con type vacio por extension', () => {
    const onChange = vi.fn();
    const { container } = render(<EvidenciaInput value={{ mode: 'file' }} onChange={onChange} />);
    const f = new File(['x'], 'informe.DOCX', { type: '' });
    fireEvent.change(fileInput(container), { target: { files: [f] } });
    expect(onChange).toHaveBeenCalledWith({ mode: 'file', file: f });
  });

  it('rechaza enlace con scheme javascript:', () => {
    const onChange = vi.fn();
    render(<EvidenciaInput value={{ mode: 'link' }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Enlace de evidencia/i), {
      target: { value: 'javascript:alert(1)' },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ link: 'javascript:alert(1)' }),
    );
  });

  it('acepta enlace https', () => {
    const onChange = vi.fn();
    render(<EvidenciaInput value={{ mode: 'link' }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Enlace de evidencia/i), {
      target: { value: 'https://a.com/x' },
    });
    expect(onChange).toHaveBeenCalledWith({ mode: 'link', link: 'https://a.com/x' });
  });
});
