import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), create: vi.fn() }));

vi.mock('axios', () => {
  const instance = { get: mocks.get, post: mocks.post, patch: vi.fn(), interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } };
  mocks.create.mockReturnValue(instance);
  return { default: { create: mocks.create }, create: mocks.create };
});
vi.mock('./api', () => ({ api: {} }));

import { publicRequisicionService } from './publicRequisicion.service';

describe('publicRequisicionService purchase order (winner)', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset().mockResolvedValue({ data: { data: { ok: true } } });
  });

  it('downloads the PDF from the token path as a blob', async () => {
    const blob = new Blob(['pdf']);
    mocks.get.mockResolvedValue({ data: blob });
    await expect(publicRequisicionService.descargarOrdenCompraPdf('tok/en')).resolves.toBe(blob);
    expect(mocks.get).toHaveBeenCalledWith('/public/requisiciones/tok%2Fen/orden-compra/pdf', { responseType: 'blob' });
  });

  it('strips the axios config (token) and decodes the error code of a failed PDF download', async () => {
    const body = new Blob([JSON.stringify({ error: { code: 'TOKEN_EXPIRADO' } })]);
    mocks.get.mockRejectedValue({ config: { url: '/public/requisiciones/secret-token/orden-compra/pdf' }, response: { status: 403, data: body } });
    const error = (await publicRequisicionService.descargarOrdenCompraPdf('secret-token').catch((e: unknown) => e)) as {
      response: { status: number; data: { error: { code: string } } };
      config?: unknown;
    };
    expect(error.response.status).toBe(403);
    expect(error.response.data.error.code).toBe('TOKEN_EXPIRADO');
    expect(error.config).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain('secret-token');
  });

  it('uploads the supports as multipart under `archivos`', async () => {
    const file = new File(['%PDF'], 'acta.pdf', { type: 'application/pdf' });
    await publicRequisicionService.subirEntregables('tok', [file]);
    const [url, body] = mocks.post.mock.calls[0];
    expect(url).toBe('/public/requisiciones/tok/entregables');
    expect((body as FormData).getAll('archivos')).toHaveLength(1);
  });

  it('rethrows an upload failure without the axios config', async () => {
    mocks.post.mockRejectedValue({ config: { url: '/public/requisiciones/secret-token/entregables' }, response: { status: 400, data: { error: { code: 'FILE_CONTENT_MISMATCH' } } } });
    const error = (await publicRequisicionService.subirEntregables('secret-token', []).catch((e: unknown) => e)) as { response: { status: number }; config?: unknown };
    expect(error.response.status).toBe(400);
    expect(error.config).toBeUndefined();
  });
});
