import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('./api', () => ({ api: http }));

import { ordenCompraService } from './ordenCompra.service';
import { requisicionService } from './requisicion.service';

describe('ordenCompraService', () => {
  beforeEach(() => {
    Object.values(http).forEach((fn) => fn.mockReset().mockResolvedValue({ data: { success: true, data: { ok: true } } }));
  });

  const dto = { lineas: [{ lineaId: 'l1', precioUnitario: 10 }], condiciones: 'x', fechaEntrega: '2026-12-01', requiereEntregables: true };

  it('issues and edits the order with the same body', async () => {
    await ordenCompraService.emitir('r1', dto);
    await ordenCompraService.editar('r1', dto);
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/orden-compra', dto);
    expect(http.patch).toHaveBeenCalledWith('/requisiciones/r1/orden-compra', dto);
  });

  it('approves, rejects (observation), sends and resends', async () => {
    await ordenCompraService.aprobar('r1', { version: 2 });
    await ordenCompraService.rechazar('r1', { observacion: 'no', version: 2 });
    await ordenCompraService.enviar('r1');
    await ordenCompraService.reenviar('r1');
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/orden-compra/aprobar', { version: 2 });
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/orden-compra/rechazar', { observacion: 'no', version: 2 });
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/orden-compra/enviar');
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/orden-compra/reenviar');
  });

  it('returns the envelope of the updated requisicion', async () => {
    const result = await ordenCompraService.aprobar('r1', { version: 1 });
    expect(result).toEqual({ success: true, data: { ok: true } });
  });

  it('resends without body, or with correoEnvio only when given', async () => {
    await ordenCompraService.reenviar('r1');
    expect(http.post).toHaveBeenLastCalledWith('/requisiciones/r1/orden-compra/reenviar');
    await ordenCompraService.reenviar('r1', { correoEnvio: 'a@b.co' });
    expect(http.post).toHaveBeenLastCalledWith('/requisiciones/r1/orden-compra/reenviar', { correoEnvio: 'a@b.co' });
  });

  it('downloads the PDF as a blob', async () => {
    const blob = new Blob(['pdf']);
    http.get.mockResolvedValue({ data: blob });
    await expect(ordenCompraService.descargarPdf('r1')).resolves.toBe(blob);
    expect(http.get).toHaveBeenCalledWith('/requisiciones/r1/orden-compra/pdf', { responseType: 'blob' });
  });

  it('decodes the JSON error of a failed PDF download so the code is readable', async () => {
    const body = new Blob([JSON.stringify({ success: false, error: { code: 'PDF_NO_DISPONIBLE' } })], { type: 'application/json' });
    http.get.mockRejectedValue({ response: { status: 502, data: body } });
    const error = (await ordenCompraService.descargarPdf('r1').catch((e: unknown) => e)) as { response: { data: { error: { code: string } } } };
    expect(error.response.data.error.code).toBe('PDF_NO_DISPONIBLE');
  });

  it('uploads deliverables as multipart, one `archivos` part per file', async () => {
    const a = new File(['a'], 'a.pdf', { type: 'application/pdf' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });
    await ordenCompraService.subirEntregables('r1', [a, b]);
    const [url, body] = http.post.mock.calls[0];
    expect(url).toBe('/requisiciones/r1/entregables');
    expect((body as FormData).getAll('archivos')).toHaveLength(2);
  });

  it('drives the review cycle', async () => {
    await ordenCompraService.marcarRecibidos('r1');
    await ordenCompraService.revisarEntregables('r1');
    await ordenCompraService.aceptarEntregables('r1');
    await ordenCompraService.devolverEntregables('r1', { observacion: 'falta' });
    expect(http.patch).toHaveBeenCalledWith('/requisiciones/r1/entregables/marcar-recibidos');
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/entregables/revisar');
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/entregables/aceptar');
    expect(http.post).toHaveBeenCalledWith('/requisiciones/r1/entregables/devolver', { observacion: 'falta' });
  });

  it('lists the oc-por-aprobar view through the shared list (vista is an allowed query key)', async () => {
    await requisicionService.list({ vista: 'oc-por-aprobar', page: 1, limit: 1 });
    expect(http.get).toHaveBeenCalledWith('/requisiciones', { params: { vista: 'oc-por-aprobar', page: 1, limit: 1 } });
  });
});
