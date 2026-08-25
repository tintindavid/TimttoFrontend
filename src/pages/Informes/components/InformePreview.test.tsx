import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InformePreview } from './InformePreview';
import { InformePayload } from '@/types/informe.types';

function basePayload(): InformePayload {
  return {
    meta: {
      clienteId: 'c1',
      clienteNombre: 'Clínica Ejemplo',
      clienteCiudad: 'Bogotá',
      clienteLogo: null,
      periodoDesde: 'ene',
      periodoHasta: 'ene',
      periodoLabel: 'Enero 2026',
      fechaGeneracion: '2026-01-31T00:00:00.000Z',
      mesesSeleccionados: ['ene'],
      tenantNombre: 'Timtto SAS',
      responsableNombre: 'Ana Técnica',
      responsableFirmaUrl: null,
    },
    kpis: {
      cumplimientoPreventivo: 100,
      totalProgramados: 1,
      totalRealizados: 1,
      totalCorrectivos: 0,
      totalRepuestosSolicitados: 0,
      totalRepuestosInstalados: 0,
      costoTotalRepuestos: 0,
      horasServicio: 0,
    },
    preventivos: [],
    correctivos: [],
    equipos: [
      {
        equipoId: 'eq1',
        nombre: 'Ventilador',
        marca: 'Dräger',
        serie: 'SN-1',
        inventario: 'INV-1',
        sede: 'Sede A',
        servicio: 'UCI',
        mesesMtto: ['ene'],
        totalProgramados: 1,
        totalRealizados: 1,
        cumplimiento: 100,
        estadoOperativo: 'Operativo',
        costoRepuestos: 0,
      },
    ],
    repuestos: [],
    costos: { repuestos: 0 },
    observaciones: [],
    observacionGeneral: '',
  };
}

describe('InformePreview — equipos table', () => {
  it('renders a Marca column header and the equipo marca cell', () => {
    render(<InformePreview payload={basePayload()} />);
    expect(screen.getByText('Marca')).toBeInTheDocument();
    expect(screen.getByText('Dräger')).toBeInTheDocument();
  });
});
