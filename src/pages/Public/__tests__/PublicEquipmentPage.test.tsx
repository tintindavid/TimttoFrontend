import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicEquipmentPage from '../PublicEquipmentPage';
import { PublicEquipmentPayload } from '@/types/equipmentQr.types';

const mockUsePublicEquipmentByToken = vi.fn();
vi.mock('@/hooks/usePublicEquipment', () => ({
  usePublicEquipmentByToken: (...args: unknown[]) => mockUsePublicEquipmentByToken(...args),
}));

const payload: PublicEquipmentPayload = {
  equipo: {
    item: 'Monitor de signos vitales',
    marca: 'Mindray',
    modelo: 'X1',
    serie: 'S-001',
    inventario: 'INV-001',
    ubicacion: 'UCI',
    estadoOperativo: 'Operativo',
    ultimoMtto: '2026-09-01T10:00:00.000Z',
  },
  cliente: { nombre: 'Clínica Ejemplo', logoUrl: null },
  sede: { nombre: 'Sede Norte' },
  historial: [
    {
      _id: 'h1',
      consecutivo: 'R-0001',
      fecha: '2026-09-01T10:00:00.000Z',
      tipoMtto: 'Preventivo',
      responsable: 'Juan Pérez',
      estadoOperativoFinal: 'Operativo',
      tieneObservacion: false,
      observacionEstadoFinal: null,
    },
    {
      _id: 'h2',
      consecutivo: 'R-0002',
      fecha: '2026-08-01T10:00:00.000Z',
      tipoMtto: 'Correctivo',
      responsable: 'Ana Gómez',
      estadoOperativoFinal: 'Fuera de Servicio',
      tieneObservacion: true,
      observacionEstadoFinal: 'pendiente repuesto',
    },
  ],
};

const renderAt = (token = 'tok-123') =>
  render(
    <MemoryRouter initialEntries={[`/public/equipo/${token}`]}>
      <Routes>
        <Route path="/public/equipo/:qrToken" element={<PublicEquipmentPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PublicEquipmentPage', () => {
  beforeEach(() => {
    mockUsePublicEquipmentByToken.mockReset();
  });

  it('renders the payload: header, info grid, and history cards', () => {
    mockUsePublicEquipmentByToken.mockReturnValue({
      data: { data: payload },
      isLoading: false,
      isError: false,
    });

    renderAt();

    expect(screen.getByText('Clínica Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('Sede Norte')).toBeInTheDocument();
    expect(screen.getByText('Monitor de signos vitales · Mindray · X1')).toBeInTheDocument();
    expect(screen.getByText('S-001')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    // Card header renders as "Preventivo R-0001" (tipoMtto + consecutivo in
    // a single text node), hence the substring matcher.
    expect(screen.getByText(/R-0001/)).toBeInTheDocument();
    expect(screen.getByText(/R-0002/)).toBeInTheDocument();
  });

  it('maps the EstadoOperativo badge color: green for Operativo, red for Fuera de Servicio', () => {
    mockUsePublicEquipmentByToken.mockReturnValue({
      data: { data: payload },
      isLoading: false,
      isError: false,
    });

    renderAt();

    const headerBadge = screen.getAllByText('Operativo')[0];
    // Badge palette tuned manually in estadoOperativoBadge.util — keep this
    // assertion in sync with that file.
    expect(headerBadge).toHaveStyle({ backgroundColor: '#2bd96b' });

    const fueraDeServicioBadge = screen.getByText('Fuera de Servicio');
    expect(fueraDeServicioBadge).toHaveStyle({ backgroundColor: '#DC2626' });
  });

  it('shows the eye icon only on cards with tieneObservacion=true, and opens the observation modal on click', () => {
    mockUsePublicEquipmentByToken.mockReturnValue({
      data: { data: payload },
      isLoading: false,
      isError: false,
    });

    renderAt();

    const eyeButtons = screen.getAllByRole('button', { name: 'Ver observación' });
    expect(eyeButtons).toHaveLength(1);

    fireEvent.click(eyeButtons[0]);
    expect(screen.getByText('pendiente repuesto')).toBeInTheDocument();
  });

  it('shows a friendly empty state when historial is empty', () => {
    mockUsePublicEquipmentByToken.mockReturnValue({
      data: { data: { ...payload, historial: [] } },
      isLoading: false,
      isError: false,
    });

    renderAt();

    expect(
      screen.getByText('Aún no hay servicios registrados para este equipo'),
    ).toBeInTheDocument();
  });

  it('shows the friendly 404 page on an invalid/unknown token', () => {
    mockUsePublicEquipmentByToken.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderAt('invalid');

    expect(screen.getByText('No encontramos este equipo')).toBeInTheDocument();
  });
});
