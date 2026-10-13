import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentoModal from './DocumentoModal';

const renderModal = (onSubmit = vi.fn()) => {
  render(<DocumentoModal show onHide={vi.fn()} onSubmit={onSubmit} />);
  return onSubmit;
};

const makeFile = (name: string, size: number, type = 'application/pdf') => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('DocumentoModal', () => {
  it('disables "Guardar" when neither link nor file is set', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Manual' } });
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('shows an error and keeps "Guardar" disabled for files larger than 10 MiB', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Manual' } });
    const input = screen.getByLabelText(/Archivo/) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('big.pdf', 11 * 1024 * 1024)] } });

    expect(screen.getByText(/supera el tamaño máximo de 10 MB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('emits the payload with link on submit', () => {
    const onSubmit = renderModal();
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: '  Manual  ' } });
    fireEvent.change(screen.getByLabelText(/Enlace/), { target: { value: 'https://example.com/m.pdf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Manual', link: 'https://example.com/m.pdf' });
  });

  it('emits the payload with the file on submit', () => {
    const onSubmit = renderModal();
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Ficha' } });
    const file = makeFile('ficha.pdf', 1024);
    fireEvent.change(screen.getByLabelText(/Archivo/), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nombre: 'Ficha', link: '', archivo: file });
  });

  it('rejects an invalid link', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Manual' } });
    fireEvent.change(screen.getByLabelText(/Enlace/), { target: { value: 'not a url' } });
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});
