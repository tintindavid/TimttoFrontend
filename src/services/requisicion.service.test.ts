import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('./api', () => ({ api: { get: mocks.get, post: mocks.post, patch: vi.fn(), delete: vi.fn() } }));

import { requisicionService } from './requisicion.service';
import { REQUISICION_QUERY_KEYS, REQUISICION_SORT_FIELDS } from '@/types/requisicion.types';

describe('requisicionService contract with the backend', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: { data: [] } });
    mocks.post.mockReset().mockResolvedValue({ data: { data: {} } });
  });

  it('list sends only keys the backend DTO accepts (it answers 400 to unknown keys)', async () => {
    await requisicionService.list({
      page: 1,
      limit: 20,
      vista: 'mias',
      search: 'x',
      estado: 'Aprobada',
      areaId: 'a1',
      tipoRequisicionId: 't1',
      creadaPor: 'u1',
      fechaDesde: '2026-01-01',
      fechaHasta: '2026-02-01',
      sortBy: 'createdAt',
      order: 'desc',
      // Unknown keys must never reach the wire.
      ...({ foo: 'bar', sort: 'x' } as object),
    });
    const sent = Object.keys(mocks.get.mock.calls[0][1].params);
    expect(sent.sort()).toEqual([...REQUISICION_QUERY_KEYS].sort());
  });

  it('list drops undefined and empty values', async () => {
    await requisicionService.list({ page: 1, search: undefined, estado: undefined });
    expect(mocks.get.mock.calls[0][1].params).toEqual({ page: 1 });
  });

  it('only the documented sort fields exist', () => {
    expect([...REQUISICION_SORT_FIELDS]).toEqual(['createdAt', 'consecutivo', 'montoEstimado', 'estado', 'titulo']);
  });

  it('reasignarAprobadores posts to the reasignar endpoint', async () => {
    await requisicionService.reasignarAprobadores('r1', { nivelOrden: 2, aprobadorIds: ['u1'] });
    expect(mocks.post).toHaveBeenCalledWith('/requisiciones/r1/aprobacion/reasignar', { nivelOrden: 2, aprobadorIds: ['u1'] });
  });

  it('aprobar and rechazar send the version', async () => {
    await requisicionService.aprobar('r1', { version: 3 });
    await requisicionService.rechazar('r1', { version: 3, observacion: 'no' });
    expect(mocks.post).toHaveBeenNthCalledWith(1, '/requisiciones/r1/aprobacion/aprobar', { version: 3 });
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/requisiciones/r1/aprobacion/rechazar', { version: 3, observacion: 'no' });
  });
});
