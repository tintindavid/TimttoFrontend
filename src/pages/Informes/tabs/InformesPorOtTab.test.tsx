import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const authState = { user: { fileFirma: 'https://x/firma.png' } as { fileFirma?: string } };

vi.mock('@/context/AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ can: () => false, organizationCustomerId: 'org1' }),
}));
vi.mock('@/hooks/useCustomers', () => ({ useCustomers: () => ({ data: undefined, isLoading: false }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../components/RichTextEditor', () => ({
  RichTextEditor: ({ onChange }: { onChange: (h: string) => void }) => (
    <>
      <button onClick={() => onChange('<p>hola</p>')}>mock-editor</button>
      <button onClick={() => onChange('x'.repeat(20001))}>mock-editor-long</button>
      <button onClick={() => onChange('<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>')}>mock-editor-xss</button>
    </>
  ),
}));
vi.mock('../components/InformePorOtPreview', () => ({
  InformePorOtPreview: ({ payload }: { payload: { observacionesAdicionalesHtml?: string; fotos?: { evidenciaId: string }[] } }) => (
    <div>
      mock-preview
      <span data-testid="live-html">{payload.observacionesAdicionalesHtml ?? ''}</span>
      <span data-testid="live-fotos">{(payload.fotos ?? []).map((f) => f.evidenciaId).join(',')}</span>
    </div>
  ),
}));
vi.mock('../components/SelectOtsModal', () => ({
  SelectOtsModal: ({ show, onConfirm }: { show: boolean; onConfirm: (ids: string[]) => void }) =>
    show ? <button onClick={() => onConfirm(['ot1', 'ot2'])}>mock-confirm-ots</button> : null,
}));
vi.mock('../components/SelectFotosModal', () => ({
  SelectFotosModal: ({ show, onConfirm }: { show: boolean; onConfirm: (f: unknown[]) => void }) =>
    show ? (
      <>
      <button onClick={() => onConfirm([{ evidenciaId: 'e9', url: 'https://x/9.jpg', nombre: 'f9', descripcion: '', reporteId: 'r1', reporteConsecutivo: 'R1', equipoNombre: 'E' }])}>mock-confirm-fotos-new</button>
      <button
        onClick={() =>
          onConfirm([
            { evidenciaId: 'e1', url: 'https://x/1.jpg', nombre: 'f1', descripcion: '', reporteId: 'r1', reporteConsecutivo: 'R1', equipoNombre: 'E' },
          ])
        }
      >
        mock-confirm-fotos
      </button>
      </>
    ) : null,
}));
vi.mock('../components/SignatureRequiredModal', () => ({
  SignatureRequiredModal: ({ show }: { show: boolean }) => (show ? <div>firma-requerida</div> : null),
}));
vi.mock('@/services/informe.service', () => ({
  informeService: {
    generateByOt: vi.fn(),
    downloadPdfByOt: vi.fn().mockResolvedValue(undefined),
    downloadXlsxByOt: vi.fn(),
  },
}));

import { informeService } from '@/services/informe.service';
import { toast } from 'react-toastify';
import { InformesPorOtTab } from './InformesPorOtTab';

const xlsx = informeService.downloadXlsxByOt as unknown as ReturnType<typeof vi.fn>;

async function selectOts() {
  fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar OTs' }));
  fireEvent.click(await screen.findByText('mock-confirm-ots'));
}

describe('InformesPorOtTab - Excel, fotos y observaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    xlsx.mockReset();
    authState.user = { fileFirma: 'https://x/firma.png' };
  });

  it('disables "Descargar Excel" until OTs are selected', () => {
    render(<InformesPorOtTab />);
    expect(screen.getByRole('button', { name: 'Descargar Excel' })).toBeDisabled();
  });

  it('downloads the Excel sending only clienteId and otIds, even with photos and notes', async () => {
    xlsx.mockResolvedValue(undefined);
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByText('mock-editor'));
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar fotos' }));
    fireEvent.click(await screen.findByText('mock-confirm-fotos'));
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    await waitFor(() => expect(xlsx).toHaveBeenCalledTimes(1));
    const body = xlsx.mock.calls[0][0];
    expect(Object.keys(body).sort()).toEqual(['clienteId', 'otIds']);
    expect(body).toEqual({ clienteId: 'org1', otIds: ['ot1', 'ot2'] });
  });

  it('does not block the Excel when the rich text is over the limit', async () => {
    xlsx.mockResolvedValue(undefined);
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByText('mock-editor-long'));
    expect(screen.getByRole('button', { name: 'Generar Informe' })).toBeDisabled();
    const btn = screen.getByRole('button', { name: 'Descargar Excel' });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    await waitFor(() => expect(xlsx).toHaveBeenCalledTimes(1));
  });

  const generated = { meta: {}, kpis: {}, secciones: [], observacionesReportes: [], observacionGeneral: '', observacionesAdicionalesHtml: '<p>servidor</p>',
    fotos: [
      { evidenciaId: 'e1', url: 'https://x/1.jpg', nombre: 'f1', descripcion: '', reporteConsecutivo: 'R1', equipoNombre: 'E' },
    ] };

  it('keeps the preview and reflects rich text edits live, without regenerating', async () => {
    const gen = informeService.generateByOt as unknown as ReturnType<typeof vi.fn>;
    gen.mockClear();
    gen.mockResolvedValue({ data: generated });
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Generar Informe' }));
    expect(await screen.findByText('mock-preview')).toBeInTheDocument();
    fireEvent.click(screen.getByText('mock-editor'));
    expect(screen.getByText('mock-preview')).toBeInTheDocument();
    expect(screen.getByTestId('live-html').textContent).toBe('<p>hola</p>');
    expect(gen).toHaveBeenCalledTimes(1);
  });

  it('sanitizes the live preview HTML on the client', async () => {
    (informeService.generateByOt as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: generated });
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Generar Informe' }));
    await screen.findByText('mock-preview');
    fireEvent.click(screen.getByText('mock-editor-xss'));
    expect(screen.getByTestId('live-html').textContent).toBe('<p>ok</p>');
  });

  it('filters removed photos from the live preview and drops it only when photos are added', async () => {
    (informeService.generateByOt as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: generated });
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar fotos' }));
    fireEvent.click(await screen.findByText('mock-confirm-fotos'));
    fireEvent.click(screen.getByRole('button', { name: 'Generar Informe' }));
    await screen.findByText('mock-preview');
    expect(screen.getByTestId('live-fotos').textContent).toBe('e1');
    fireEvent.click(screen.getByRole('button', { name: /Quitar foto/ }));
    expect(screen.getByText('mock-preview')).toBeInTheDocument();
    expect(screen.getByTestId('live-fotos').textContent).toBe('');
    // Adding a photo the server has not resolved invalidates the preview.
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar fotos' }));
    fireEvent.click(await screen.findByText('mock-confirm-fotos-new'));
    expect(screen.queryByText('mock-preview')).not.toBeInTheDocument();
  });

  it('clears chosen photos when the OTs change', async () => {
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar fotos' }));
    fireEvent.click(await screen.findByText('mock-confirm-fotos'));
    expect(screen.getByText('1 de 10 fotos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar selección' }));
    fireEvent.click(await screen.findByText('mock-confirm-ots'));
    expect(screen.getByText('0 de 10 fotos')).toBeInTheDocument();
  });

  it('shows a Spanish error toast when the Excel download fails', async () => {
    xlsx.mockRejectedValue(new Error('Error 400'));
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error 400'));
  });

  it('asks for the signature before downloading the Excel', async () => {
    authState.user = {};
    render(<InformesPorOtTab />);
    await selectOts();
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    expect(await screen.findByText('firma-requerida')).toBeInTheDocument();
    expect(xlsx).not.toHaveBeenCalled();
  });
});
