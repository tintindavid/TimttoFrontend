import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InformePorOtPreview } from './InformePorOtPreview';
import { InformePorOtPayload, InformeSeccion } from '@/types/informe.types';

function makeReporte(overrides: Partial<InformeSeccion['reportes'][number]> = {}) {
  return {
    reporteId: 'r1',
    consecutivo: 'R000001',
    otId: 'ot1',
    otConsecutivo: 'OT-0001',
    equipoId: 'eq1',
    equipoNombre: 'Ventilador',
    marca: 'Dräger',
    modelo: 'V500',
    serie: 'SN-1',
    inventario: 'INV-1',
    ubicacion: 'Piso 3',
    sede: 'Sede A',
    servicio: 'UCI',
    estadoReporte: 'Cumplido' as const,
    estadoOperativo: 'Operativo',
    fechaProgramada: '2026-01-05T00:00:00.000Z',
    fechaRealizado: '2026-01-06T00:00:00.000Z',
    tecnico: 'Juan Pérez',
    ...overrides,
  };
}

function basePayload(overrides: Partial<InformePorOtPayload> = {}): InformePorOtPayload {
  return {
    meta: {
      clienteId: 'c1',
      clienteNombre: 'Clínica Ejemplo',
      clienteNit: '900123456',
      clienteCiudad: 'Bogotá',
      clienteDepartamento: 'Cundinamarca',
      clienteDireccion: 'Cra 7 #100-20',
      clienteEmail: 'admin@acme.co',
      clienteTelefono: '3001234567',
      clienteContacto: 'Juana Perez',
      clienteLogo: null,
      tenantNombre: 'Timtto SAS',
      fechaGeneracion: '2026-01-10T00:00:00.000Z',
      responsableNombre: 'Ana Técnica',
      responsableFirmaUrl: null,
      otsSeleccionadas: [
        { otId: 'ot1', consecutivo: 'OT-0001', tipoServicio: 'Preventivo', fechaCreacion: '2026-01-01T00:00:00.000Z', estadoOt: 'Cerrada' },
      ],
    },
    kpis: {
      cumplimientoPct: 75,
      totalReportes: 4,
      cumplidos: 3,
      pendientes: 1,
      cancelados: 0,
      correctivos: 0,
      repuestosInstalados: 0,
      costoTotal: 0,
      horasServicio: 0,
    },
    secciones: [],
    observacionesReportes: [],
    observacionGeneral: '',
    ...overrides,
  };
}

describe('InformePorOtPreview', () => {
  it('renders section headers in alphabetical order by sede then servicio', () => {
    const payload = basePayload({
      secciones: [
        { sede: 'Sede B', servicio: 'Servicio A', cumplimientoPct: 100, reportes: [makeReporte()], repuestos: [] },
        { sede: 'Sede A', servicio: 'Servicio Z', cumplimientoPct: 100, reportes: [makeReporte()], repuestos: [] },
        { sede: 'Sede A', servicio: 'Servicio A', cumplimientoPct: 100, reportes: [makeReporte()], repuestos: [] },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    const headers = screen.getAllByRole('heading', { level: 6 }).map((h) => h.textContent);
    const sectionHeaders = headers.filter((h) => h?.includes('/'));
    expect(sectionHeaders).toEqual(['Sede A / Servicio A', 'Sede A / Servicio Z', 'Sede B / Servicio A']);
  });

  it('renders the section-level cumplimiento percentage', () => {
    const payload = basePayload({
      secciones: [
        { sede: 'Sede A', servicio: 'UCI', cumplimientoPct: 75, reportes: [makeReporte()], repuestos: [] },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.getAllByText('75%').length).toBeGreaterThan(0);
  });

  it('renders "—" when the section cumplimiento denominator is zero', () => {
    const payload = basePayload({
      secciones: [
        { sede: 'Sede A', servicio: 'UCI', cumplimientoPct: null, reportes: [makeReporte({ estadoReporte: 'Cancelado' })], repuestos: [] },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats report observations with the consecutivo and estadoOperativo, then appends observacionGeneral', () => {
    const payload = basePayload({
      observacionesReportes: [
        { consecutivo: 'R000112', estadoOperativo: 'Fuera de Servicio', observacion: 'Se recomienda cambio de pera' },
      ],
      observacionGeneral: 'Todo en orden en general.',
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.getByText('R000112')).toBeInTheDocument();
    expect(screen.getByText('"Fuera de Servicio"')).toBeInTheDocument();
    expect(screen.getByText(/Se recomienda cambio de pera/)).toBeInTheDocument();
    expect(screen.getByText('Todo en orden en general.')).toBeInTheDocument();
  });

  it('does not render a section that has zero reportes', () => {
    const payload = basePayload({
      secciones: [
        { sede: 'Sede A', servicio: 'UCI', cumplimientoPct: null, reportes: [], repuestos: [] },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.queryByText(/Sede A \/ UCI/)).not.toBeInTheDocument();
  });

  it('omits the repuestos table when the section has no repuestos', () => {
    const payload = basePayload({
      secciones: [
        { sede: 'Sede A', servicio: 'UCI', cumplimientoPct: 100, reportes: [makeReporte()], repuestos: [] },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.queryByText('Repuestos')).not.toBeInTheDocument();
  });

  it('renders the consolidated repuestos table when the section has repuestos', () => {
    const payload = basePayload({
      secciones: [
        {
          sede: 'Sede A',
          servicio: 'UCI',
          cumplimientoPct: 100,
          reportes: [makeReporte()],
          repuestos: [
            { reporteConsecutivo: 'R000001', equipo: 'Ventilador', repuesto: 'Batería', cantidad: 1, estado: 'Instalado', precio: 50000, fecha: '2026-01-06T00:00:00.000Z', observacion: '' },
          ],
        },
      ],
    });
    render(<InformePorOtPreview payload={payload} />);
    expect(screen.getByText('Repuestos')).toBeInTheDocument();
    expect(screen.getByText('Batería')).toBeInTheDocument();
  });
});
