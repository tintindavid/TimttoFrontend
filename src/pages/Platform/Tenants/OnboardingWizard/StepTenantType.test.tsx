import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StepTenantType from './StepTenantType';
import Step1TenantData from './Step1TenantData';

describe('StepTenantType', () => {
  it('shows the three presets with their flags and defaults to Prestador without notices', () => {
    render(<StepTenantType onNext={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Prestador' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Cliente' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Mixto' })).not.toBeChecked();
    expect(screen.getAllByText(/Ejecuta servicios:/)).toHaveLength(3);
    expect(screen.queryByText(/versión posterior/)).toBeNull();
  });

  it('shows the third-party maintenance notice and the required-data note for Cliente', () => {
    const onNext = vi.fn();
    render(<StepTenantType onNext={onNext} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Cliente' }));
    expect(screen.getByText(/versión posterior/)).toBeTruthy();
    expect(screen.getByText(/son obligatorios NIT, ciudad, departamento, email y/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onNext).toHaveBeenCalledWith('client');
  });

  it('shows the notice for Mixto without the required-data note', () => {
    render(<StepTenantType onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Mixto' }));
    expect(screen.getByText(/versión posterior/)).toBeTruthy();
    expect(screen.queryByText(/son obligatorios NIT/)).toBeNull();
  });
});

describe('Step1TenantData requireOrgData', () => {
  const fillBasics = () => {
    fireEvent.change(screen.getByPlaceholderText('ej. mi-empresa-sas'), { target: { value: 'acme-sas' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre comercial'), { target: { value: 'Acme SAS' } });
  };

  it('blocks submit until nit, ciudad, departamento, email and teléfono are filled', async () => {
    const onNext = vi.fn();
    render(<Step1TenantData onNext={onNext} requireOrgData />);
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => expect(screen.getByText(/NIT es requerido/)).toBeTruthy());
    expect(screen.getByText(/teléfono es requerido/)).toBeTruthy();
    expect(screen.getByText(/ciudad es requerida/)).toBeTruthy();
    expect(screen.getByText(/departamento es requerido/)).toBeTruthy();
    expect(screen.getByText(/email es requerido/)).toBeTruthy();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('does not require organization data for other types', async () => {
    const onNext = vi.fn();
    render(<Step1TenantData onNext={onNext} />);
    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    await waitFor(() => expect(onNext).toHaveBeenCalled());
  });
});
