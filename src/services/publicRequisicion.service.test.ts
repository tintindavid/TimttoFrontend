import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  create: vi.fn(),
  sharedApi: vi.fn(),
}));

vi.mock('axios', () => {
  const instance = { get: mocks.get, patch: mocks.patch, interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } } };
  mocks.create.mockReturnValue(instance);
  return { default: { create: mocks.create }, create: mocks.create };
});
// The shared authenticated instance must never be touched by the public service.
vi.mock('./api', () => {
  mocks.sharedApi();
  return { api: {} };
});

import { publicRequisicionService } from './publicRequisicion.service';

describe('publicRequisicionService', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: { data: { ok: true } } });
    mocks.patch.mockReset().mockResolvedValue({ data: { data: { ok: true } } });
  });

  it('uses its own axios instance without credentials, auth interceptors or tenant headers', () => {
    expect(mocks.sharedApi).not.toHaveBeenCalled();
    const config = mocks.create.mock.calls[0][0];
    expect(config.withCredentials).toBe(false);
    expect(Object.keys(config.headers).map((h) => h.toLowerCase())).toEqual(['accept']);
  });

  it('reads the portal data from the token path', async () => {
    await publicRequisicionService.get('tok/en');
    expect(mocks.get).toHaveBeenCalledWith('/public/requisiciones/tok%2Fen');
  });

  it('rethrows failures without the axios config so the token never reaches a logger', async () => {
    mocks.get.mockRejectedValue({ config: { url: '/public/requisiciones/secret-token' }, response: { status: 403, data: { error: { code: 'TOKEN_EXPIRADO' } } } });
    const error = await publicRequisicionService.get('secret-token').catch((e: unknown) => e);
    expect((error as { response: { status: number } }).response.status).toBe(403);
    expect(JSON.stringify(error)).not.toContain('secret-token');
    expect((error as { config?: unknown }).config).toBeUndefined();
  });

  it('answers the invitation with a boolean body', async () => {
    await publicRequisicionService.responderInvitacion('tok', true);
    expect(mocks.patch).toHaveBeenCalledWith('/public/requisiciones/tok/respuesta-invitacion', { aceptar: true });
  });

  it('sends the quotation as multipart with only the fields present', async () => {
    const file = new File(['%PDF'], 'oferta.pdf', { type: 'application/pdf' });
    await publicRequisicionService.enviarCotizacion('tok', { archivo: file, valorTotal: 1500, moneda: 'COP' });
    const [url, form, options] = mocks.patch.mock.calls[0];
    expect(url).toBe('/public/requisiciones/tok/respuesta');
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get('archivo')).toBeInstanceOf(File);
    expect((form as FormData).get('valorTotal')).toBe('1500');
    expect((form as FormData).has('observacion')).toBe(false);
    expect(options.headers['Content-Type']).toBe('multipart/form-data');
  });
});
