import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CrearProveedorModal from './CrearProveedorModal';

const mockCreate = vi.fn();
// A plain (non-spy) function: vitest flags rejections produced by spies as unhandled even when the component catches them.
let rejection: Error | null = null;
const failWith = (err: Error) => { rejection = err; };
vi.mock('@/hooks/useCustomers', () => ({
  useCreateCustomer: () => ({
    mutateAsync: (fd: FormData) => (rejection ? new Promise((_, reject) => { reject(rejection); }) : mockCreate(fd)),
    isLoading: false,
  }),
}));

/** An axios-like error: a real Error carrying the server response. */
const apiError = (message: string, code: string) =>
  Object.assign(new Error('Request failed'), { response: { data: { message, error: { code } } } });

const fill = (over: Record<string, string> = {}) => {
  const values: Record<string, string> = {
    'Razón social *': 'Metrologia Andina SAS', 'NIT *': '900111222', 'Ciudad *': 'Bogota',
    'Departamento *': 'Cundinamarca', 'Correo *': 'contacto@metrologia.example', ...over,
  };
  Object.entries(values).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } }));
};

const setup = () => {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<CrearProveedorModal show onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated };
};

beforeEach(() => {
  mockCreate.mockReset();
  rejection = null;
});

describe('CrearProveedorModal', () => {
  it('creates a provider (kind=provider, no logo) and reports it', async () => {
    mockCreate.mockResolvedValue({ data: { _id: 'p1', Razonsocial: 'Metrologia Andina SAS' } });
    const { onCreated } = setup();
    fill({ 'Teléfono': '3001234567', 'Dirección': 'Calle 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ _id: 'p1', Razonsocial: 'Metrologia Andina SAS' }));
    const fd = mockCreate.mock.calls[0][0] as FormData;
    expect(fd.get('kind')).toBe('provider');
    expect(fd.get('Razonsocial')).toBe('Metrologia Andina SAS');
    expect(fd.get('Nit')).toBe('900111222');
    expect(fd.get('TelContacto')).toBe('3001234567');
    expect(fd.get('Direccion')).toBe('Calle 1');
    expect(fd.has('logo')).toBe(false);
  });

  it('requires razón social, NIT, ciudad, departamento and correo', () => {
    setup();
    fill({ 'Ciudad *': '   ' });
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    expect(screen.getByText(/son obligatorios/)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects a NIT with letters or a verification digit', () => {
    setup();
    fill({ 'NIT *': '900111222-3' });
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    expect(screen.getByText(/NIT debe contener solo números/)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', () => {
    setup();
    fill({ 'Correo *': 'no-es-correo' });
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('shows the server message and stays open when the creation fails', async () => {
    failWith(apiError('Ya existe un tercero con ese NIT', 'DUPLICATE_NIT'));
    const { onCreated } = setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    expect(await screen.findByText('Ya existe un tercero con ese NIT')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('explains a missing permission', async () => {
    failWith(apiError('Permisos insuficientes', 'FORBIDDEN'));
    setup();
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Crear proveedor' }));
    expect(await screen.findByText('No tienes permiso para crear proveedores.')).toBeInTheDocument();
  });

  it('cancel closes without creating', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
