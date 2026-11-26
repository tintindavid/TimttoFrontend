import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResumenEquipoPage from './ResumenEquipoPage';
import { BusquedaEquipoService } from '@/services/busquedaEquipo.service';
import type { ResumenEquipo } from '@/types/busquedaEquipo.types';

let rol = 'admin';
let permisos: string[] = [];
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ tenantId: 't1', viewAsTenantId: null, user: { role: rol, permissions: permisos } }),
}));
let modulos: Record<string, boolean>;
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: (c: string) => modulos[c] ?? true, isLoading: false }),
}));
vi.mock('@/services/busquedaEquipo.service', () => ({
  BusquedaEquipoService: { buscar: vi.fn(), getResumen: vi.fn() },
}));
const getResumen = vi.mocked(BusquedaEquipoService.getResumen);

const resumen = (): ResumenEquipo => ({
  equipo: {
    _id: 'e1', nombre: 'Monitor', marca: 'GE', modelo: 'B20', serie: 'AB-123', inventario: 'INV-9', invima: '2020DM-1',
    riesgo: 'IIB', ubicacion: 'Piso 2', estado: 'Activo', estadoOperativo: 'Operativo', sede: 'Principal',
    servicio: 'UCI', mesesMtto: ['mar'], ultimoMtto: '2026-03-12T00:00:00.000Z', proximoMtto: 'sep',
    foto: 'https://img.example/foto.png',
  },
  cliente: { _id: 'c1', nombre: 'Clínica Norte' },
  hojaVida: { disponible: true, existe: true, _id: 'hv1', estado: 'Aprobada' },
  mantenimientos: {
    disponible: true, total: 7,
    recientes: [{ _id: 'r1', consecutivo: 'R000010', estado: 'Cerrado', tipoMtto: 'Preventivo', fecha: '2026-03-12T00:00:00.000Z', ot: { _id: 'o1', consecutivo: 'OT-5' } }],
  },
  actividadesExternas: {
    disponible: true, total: 1,
    recientes: [{ _id: 'a1', tipo: 'calibracion', consecutivo: 'C-1', fecha: null, proveedor: 'Metrologia SAS', estadoFinal: 'aprobada' }],
  },
  tickets: {
    disponible: true, total: 1,
    recientes: [{ _id: 'k1', consecutivo: 'T-1', status: 'pendiente', urgency: 'critico', fecha: null }],
  },
  repuestos: { disponible: true, total: 0, recientes: [] },
});

const renderPagina = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/buscar/equipo/e1']}>
        <Routes>
          <Route path="/buscar/equipo/:id" element={<ResumenEquipoPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

const enlace = (nombre: string | RegExp) => screen.queryByRole('link', { name: nombre });
const pestana = (nombre: RegExp) => screen.queryByRole('tab', { name: nombre });

beforeEach(() => {
  rol = 'admin';
  permisos = ['equipo-items:read', 'customers:read', 'ots:read'];
  modulos = {};
  getResumen.mockReset();
  getResumen.mockResolvedValue(resumen());
});

describe('ResumenEquipoPage', () => {
  it('shows the header with photo, identity, customer and its links', async () => {
    renderPagina();
    expect(await screen.findByRole('heading', { name: 'Monitor' })).toBeInTheDocument();
    expect(getResumen).toHaveBeenCalledWith('e1');
    expect(screen.getByRole('img', { name: 'Foto de Monitor' })).toHaveAttribute('src', 'https://img.example/foto.png');
    expect(enlace('Clínica Norte')).toHaveAttribute('href', '/terceros/c1');
    expect(enlace('Ver hoja de vida')).toHaveAttribute('href', '/hv-equipo/e1');
    expect(enlace('Ver cronograma')).toHaveAttribute('href', '/cronogramas?cliente=c1');
    expect(enlace(/ficha del equipo|editar/i)).toBeNull();
  });

  it('shows one tab per section with its count and links every item', async () => {
    renderPagina();
    expect(await screen.findByRole('tab', { name: /Mantenimientos\s*7/ })).toBeInTheDocument();
    expect(enlace('Reporte R000010')).toHaveAttribute('href', '/reports/r1/view');
    expect(enlace('OT OT-5')).toHaveAttribute('href', '/ots/o1');
    expect(screen.getByText('Mostrando los 1 más recientes de 7')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Actividades externas\s*1/ }));
    expect(enlace('Calibración C-1')).toHaveAttribute('href', '/hv-equipo/e1?tab=actividades-externas');

    fireEvent.click(screen.getByRole('tab', { name: /Tickets\s*1/ }));
    expect(enlace('Ticket T-1')).toHaveAttribute('href', '/tickets/k1');

    fireEvent.click(screen.getByRole('tab', { name: /Repuestos\s*0/ }));
    expect(screen.getByText('Este equipo no tiene repuestos registrados.')).toBeInTheDocument();
  });

  it('hides the unavailable sections and the resume sheet', async () => {
    const data = resumen();
    data.actividadesExternas = { disponible: false, total: 0, recientes: [] };
    data.tickets = { disponible: false, total: 0, recientes: [] };
    data.hojaVida = { disponible: false, existe: false, _id: null, estado: null };
    getResumen.mockResolvedValue(data);
    renderPagina();
    await screen.findByRole('tab', { name: /Mantenimientos/ });
    expect(pestana(/Actividades externas/)).toBeNull();
    expect(pestana(/Tickets/)).toBeNull();
    expect(pestana(/Repuestos/)).not.toBeNull();
    expect(enlace(/hoja de vida/i)).toBeNull();
    expect(screen.queryByText('Hoja de vida')).toBeNull();
  });

  it('does not link screens the user cannot open', async () => {
    rol = 'tecnico';
    permisos = ['equipo-items:read'];
    modulos = { executesServices: false };
    renderPagina();
    await screen.findByRole('tab', { name: /Mantenimientos/ });
    expect(enlace('Clínica Norte')).toBeNull();
    expect(screen.getByText('Clínica Norte')).toBeInTheDocument();
    expect(enlace('OT OT-5')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: /Tickets/ }));
    expect(enlace('Ticket T-1')).toBeNull();
    expect(screen.getByText('Ticket T-1')).toBeInTheDocument();
  });

  it('does not offer to create a missing resume sheet', async () => {
    permisos = ['equipo-items:read', 'hv-equipos:create'];
    const data = resumen();
    data.hojaVida = { disponible: true, existe: false, _id: null, estado: null };
    data.equipo.foto = null;
    getResumen.mockResolvedValue(data);
    renderPagina();
    expect(await screen.findByText('Sin hoja de vida')).toBeInTheDocument();
    expect(screen.getByText('Sin foto')).toBeInTheDocument();
    expect(enlace(/hoja de vida/i)).toBeNull();
  });

  it('shows "not found" for a foreign equipment', async () => {
    getResumen.mockRejectedValue({ isAxiosError: true, response: { status: 404 } });
    renderPagina();
    expect(await screen.findByText('Equipo no encontrado')).toBeInTheDocument();
  });

  it('offers a retry on other errors', async () => {
    getResumen.mockRejectedValueOnce(new Error('boom'));
    renderPagina();
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'Monitor' })).toBeInTheDocument();
  });
});
