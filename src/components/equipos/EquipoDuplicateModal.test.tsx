import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EquipoDuplicateModal from './EquipoDuplicateModal';
import { EquipoItem } from '@/types/equipoItem.types';

const existing: EquipoItem = {
  _id: 'eq-1',
  ItemId: { _id: 'item-1', Nombre: 'Monitor de signos vitales' },
  Marca: 'Philips',
  Modelo: 'MX40',
  Serie: 'A123',
  SedeId: { _id: 'sede-1', nombreSede: 'Sede Norte' },
  Servicio: { _id: 'serv-1', nombre: 'UCI' },
  Ubicacion: 'Piso 3',
  Estado: 'Activo',
  UltimoMtto: '2026-01-15T00:00:00.000Z',
};

const renderModal = (overrides: Partial<React.ComponentProps<typeof EquipoDuplicateModal>> = {}) =>
  render(
    <MemoryRouter>
      <EquipoDuplicateModal show onHide={vi.fn()} existing={existing} {...overrides} />
    </MemoryRouter>
  );

describe('EquipoDuplicateModal', () => {
  it('renders the passed existing equipo', () => {
    renderModal();
    expect(screen.getByText('Monitor de signos vitales')).toBeInTheDocument();
    expect(screen.getByText('Sede Norte')).toBeInTheDocument();
    expect(screen.getByText('UCI')).toBeInTheDocument();
    expect(screen.getByText('Piso 3')).toBeInTheDocument();
  });

  it('fires onUseExisting when the primary button is clicked', () => {
    const onUseExisting = vi.fn();
    renderModal({ onUseExisting });
    fireEvent.click(screen.getByRole('button', { name: 'Usar este equipo' }));
    expect(onUseExisting).toHaveBeenCalledWith(existing);
  });

  it('closes via the secondary button', () => {
    const onHide = vi.fn();
    renderModal({ onHide });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar y editar' }));
    expect(onHide).toHaveBeenCalled();
  });

  it('hides the primary action in readOnly mode', () => {
    renderModal({ readOnly: true });
    expect(screen.queryByRole('button', { name: 'Usar este equipo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar y editar' })).toBeInTheDocument();
  });

  it('uses a custom primaryLabel when provided', () => {
    renderModal({ primaryLabel: 'Agregar a la OT' });
    expect(screen.getByRole('button', { name: 'Agregar a la OT' })).toBeInTheDocument();
  });
});
