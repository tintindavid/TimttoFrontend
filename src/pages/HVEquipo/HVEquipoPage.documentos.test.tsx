import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Swal from 'sweetalert2';
import HVEquipoPage from './HVEquipoPage';
import { HVEquipo } from '@/types/hvEquipo.types';

const deleteMutateAsync = vi.fn();
const uploadMutateAsync = vi.fn();
let mockHv: Partial<HVEquipo> | null = null;

// Stable reference: a fresh object per render would re-trigger the page's effects forever.
const { stableEquipoResult } = vi.hoisted(() => ({
  stableEquipoResult: {
    data: {
      data: { _id: 'eq1', ClienteId: 'cli1', Marca: 'Dell', Modelo: 'X1', Serie: 'S1', ItemId: { _id: 'it1', Nombre: 'Computador' } },
    },
    isLoading: false,
  },
}));

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }), close: vi.fn(), showLoading: vi.fn() },
}));

vi.mock('@/hooks/useHVEquipo', () => ({
  useHVEquipoByEquipoId: () => ({
    data: mockHv ? { data: mockHv } : undefined,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useHVEquiposByMarcaModelo: () => ({ data: undefined, isLoading: false }),
  useCreateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateHVEquipo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUploadHvDocumento: () => ({ mutateAsync: uploadMutateAsync, isLoading: false }),
  useUpdateHvDocumento: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteHvDocumento: () => ({ mutateAsync: deleteMutateAsync, isLoading: false }),
}));

vi.mock('@/hooks/useEquipoItems', () => ({
  useEquipoItem: () => ({ data: undefined, isLoading: false }),
  useEquipoItemPopulated: () => stableEquipoResult,
}));

vi.mock('@/hooks/useReportes', () => ({
  useReportesByEquipo: () => ({ data: { data: [] }, isLoading: false }),
  useRepuestosByEquipo: () => ({ data: { data: [] }, isLoading: false }),
  useRepuestosByEquipoAll: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'u1', role: 'admin' } }) }));
vi.mock('@/context/userContext', () => ({ useCurrentUserData: () => ({ _id: 'u1', role: 'admin' }) }));
vi.mock('@/components/hvEquipo/VerificationTrendsTab', () => ({ default: () => null }));
vi.mock('@/components/hvEquipo/ActividadesExternasTab', () => ({ default: () => null }));
vi.mock('@/components/hvEquipo/GuiaRapidaTab', () => ({ default: () => null }));

const baseHv: Partial<HVEquipo> = {
  _id: 'hv1',
  clienteId: 'cli1',
  EquipoId: 'eq1',
  EstadoHV: 'Guardada',
  equipoSnapshot: {},
  Documentos: [
    {
      _id: 'd1',
      nombre: 'Manual de usuario',
      link: 'https://example.com/manual',
      uploadedAt: '2026-01-10T00:00:00.000Z',
    },
    {
      _id: 'd2',
      nombre: 'Ficha tecnica',
      archivoUrl: 'https://storage.example.com/ficha.pdf',
      mimetype: 'application/pdf',
      tamanoBytes: 2048,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/equipos/eq1/hv']}>
      <Routes>
        <Route path="/equipos/:equipoId/hv" element={<HVEquipoPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('HVEquipoPage - documentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    (Swal.fire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ isConfirmed: true });
    deleteMutateAsync.mockResolvedValue({});
    uploadMutateAsync.mockResolvedValue({});
    mockHv = baseHv;
  });

  it('renders the documents table from the HV', () => {
    renderPage();
    expect(screen.getByTestId('documentos-section')).toBeInTheDocument();
    expect(screen.getByText('Manual de usuario')).toBeInTheDocument();
    expect(screen.getByText('Ficha tecnica')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar/ })).toHaveAttribute(
      'href',
      'https://storage.example.com/ficha.pdf'
    );
  });

  it('keeps attached quick guides out of the general Documentos section', () => {
    mockHv = {
      ...baseHv,
      Documentos: [
        ...(baseHv.Documentos || []),
        { _id: 'g1', nombre: 'Guia Draeger', categoria: 'guia_rapida', link: 'https://example.com/guia' },
      ],
    };
    renderPage();
    const general = screen.getByTestId('documentos-section');
    expect(within(general).getByText('Manual de usuario')).toBeInTheDocument();
    expect(within(general).queryByText('Guia Draeger')).not.toBeInTheDocument();
  });

  it('lists only attached guides in the GR tab', () => {
    mockHv = {
      ...baseHv,
      Documentos: [
        ...(baseHv.Documentos || []),
        { _id: 'g1', nombre: 'Guia Draeger', categoria: 'guia_rapida', link: 'https://example.com/guia' },
      ],
    };
    renderPage();
    fireEvent.click(screen.getByText(/GR/));
    const guias = screen.getByTestId('guia-adjunta-section');
    expect(within(guias).getByText('Guía adjunta')).toBeInTheDocument();
    expect(within(guias).getByText('Guia Draeger')).toBeInTheDocument();
    expect(within(guias).queryByText('Manual de usuario')).not.toBeInTheDocument();
  });

  it('hides the attached guides block in view mode when there are none', () => {
    renderPage();
    fireEvent.click(screen.getByText(/GR/));
    expect(screen.queryByTestId('guia-adjunta-section')).not.toBeInTheDocument();
  });

  it('attaches a guide from the GR tab with categoria guia_rapida', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    fireEvent.click(screen.getByText(/GR/));
    fireEvent.click(screen.getByRole('button', { name: /Adjuntar Guía/ }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.change(dialog.getByLabelText(/Nombre/), { target: { value: 'Guia rapida' } });
    fireEvent.change(dialog.getByLabelText(/Enlace/), { target: { value: 'https://example.com/g.pdf' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(uploadMutateAsync).toHaveBeenCalledWith({
        hvId: 'hv1',
        payload: expect.objectContaining({ nombre: 'Guia rapida', categoria: 'guia_rapida' }),
      })
    );
  });

  it('does not render non-http(s) document URLs as links', () => {
    mockHv = {
      ...baseHv,
      Documentos: [{ _id: 'x1', nombre: 'Malo', link: 'javascript:alert(1)', archivoUrl: 'data:text/html;base64,AAAA' }],
    };
    renderPage();
    const section = screen.getByTestId('documentos-section');
    expect(within(section).getByText('javascript:alert(1)')).toBeInTheDocument();
    expect(section.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(section.querySelector('a[href^="data:"]')).toBeNull();
  });

  it('hides the documents section in view mode when the HV has none', () => {
    mockHv = { ...baseHv, Documentos: [] };
    renderPage();
    expect(screen.queryByTestId('documentos-section')).not.toBeInTheDocument();
  });

  it('opens the modal when clicking "Agregar Documento" in edit mode', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Agregar Documento/ }));
    expect(screen.getByText('Agregar documento')).toBeInTheDocument();
  });

  it('deletes a document after confirmation', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar documento Manual de usuario' }));

    await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith({ hvId: 'hv1', docId: 'd1' }));
  });

  it('does not delete when the confirmation is cancelled', async () => {
    (Swal.fire as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ isConfirmed: false });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar documento Manual de usuario' }));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    expect(deleteMutateAsync).not.toHaveBeenCalled();
  });
});
