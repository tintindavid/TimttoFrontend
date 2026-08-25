import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditEquipoModal from './EditEquipoModal';

const equipoDataMock = {
  _id: 'eq-1',
  Marca: 'Philips',
  Modelo: 'MX40',
  Serie: 'A123',
  Inventario: 'INV-1',
  Ubicacion: 'Piso 3',
  SedeId: 'sede-1',
  Servicio: 'serv-1',
  Riesgo: '',
  Invima: '',
  mesesMtto: ['ene'],
  EstadoOperativo: 'Operativo',
  ItemId: { _id: 'item-1' },
};

const updateMock = vi.fn().mockResolvedValue({ data: {} });

// Stable references — returning a fresh object literal from the mock on
// every render would change identity each time and, since EditEquipoModal
// depends on the `equipoData` hook result inside a `useEffect`, would loop
// forever (setFormData → re-render → new mock object → effect fires again).
const sedesQueryResult = { data: { data: [] } };
const serviciosQueryResult = { data: { data: [] } };
const itemsQueryResult = { data: { data: [] }, isLoading: false };
const equipoItemQueryResult = { data: { data: equipoDataMock }, isLoading: false };

vi.mock('@/hooks/useSedes', () => ({
  useSedesByCustomer: () => sedesQueryResult,
}));

vi.mock('@/hooks/useServicios', () => ({
  useServiciosByCustomer: () => serviciosQueryResult,
}));

vi.mock('@/hooks/useItems', () => ({
  default: () => itemsQueryResult,
}));

vi.mock('@/hooks/useEquipoItems', () => ({
  useEquipoItem: () => equipoItemQueryResult,
}));

vi.mock('@/services/equipoItem.service', () => ({
  equipoItemService: {
    update: (...args: unknown[]) => updateMock(...args),
    updateSnapshot: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) },
}));

const renderModal = () =>
  render(
    <MemoryRouter>
      <EditEquipoModal
        show
        onHide={vi.fn()}
        equipo={{ _id: 'eq-1', ClienteId: 'cust-1', SedeId: 'sede-1', Servicio: 'serv-1' }}
        reporteId={undefined}
        onSuccess={vi.fn()}
      />
    </MemoryRouter>
  );

describe('EditEquipoModal — EstadoOperativo', () => {
  beforeEach(() => {
    updateMock.mockClear();
  });

  it('sends EstadoOperativo + estadoOperativoMotivo when the state changes and a motivo is typed', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Estado Operativo'), {
      target: { value: 'Fuera de Servicio' },
    });

    const motivoField = await screen.findByLabelText('Motivo del cambio (opcional)');
    fireEvent.change(motivoField, { target: { value: 'Se dañó el sensor' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(updateMock).toHaveBeenCalledWith(
      'eq-1',
      expect.objectContaining({
        EstadoOperativo: 'Fuera de Servicio',
        estadoOperativoMotivo: 'Se dañó el sensor',
      })
    );
  });

  it('does not send a motivo when the state is left unchanged', async () => {
    renderModal();

    expect(screen.queryByLabelText('Motivo del cambio (opcional)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(updateMock).toHaveBeenCalledWith(
      'eq-1',
      expect.objectContaining({
        EstadoOperativo: 'Operativo',
        estadoOperativoMotivo: undefined,
      })
    );
  });
});
