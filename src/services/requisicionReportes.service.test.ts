import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('./api', () => ({ api: { get: mocks.get } }));

import { parseContentDispositionFilename, requisicionReportesService } from './requisicionReportes.service';
import { enlaceToPath, formatHoras } from '@/utils/requisicionReportes.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import { REQUISICION_QUERY_KEYS } from '@/types/requisicion.types';

describe('parseContentDispositionFilename', () => {
  it('reads quoted, bare and RFC 5987 names', () => {
    expect(parseContentDispositionFilename('attachment; filename="REQ-2026-0001.pdf"')).toBe('REQ-2026-0001.pdf');
    expect(parseContentDispositionFilename('attachment; filename=REQ-2.xlsx')).toBe('REQ-2.xlsx');
    expect(parseContentDispositionFilename("attachment; filename*=UTF-8''REQ%20%C3%B1.pdf")).toBe('REQ ñ.pdf');
    expect(parseContentDispositionFilename(undefined)).toBe('');
  });
});

describe('requisicionReportesService', () => {
  beforeEach(() => {
    mocks.get.mockReset().mockResolvedValue({ data: new Blob(['x']), headers: { 'content-disposition': 'attachment; filename="a.pdf"' } });
  });

  it('exports a requisicion as a blob and returns the server filename', async () => {
    const file = await requisicionReportesService.exportarRequisicion('r1', 'pdf');
    expect(mocks.get).toHaveBeenCalledWith('/requisiciones/r1/export/pdf', expect.objectContaining({ responseType: 'blob' }));
    expect(file.filename).toBe('a.pdf');
  });

  it('exports the comparativo with the formato query', async () => {
    await requisicionReportesService.exportarComparativo('r1', 'xlsx');
    expect(mocks.get).toHaveBeenCalledWith(
      '/requisiciones/r1/licitacion/comparativo/export',
      expect.objectContaining({ params: { formato: 'xlsx' }, responseType: 'blob' })
    );
  });

  it('exports the list with only the contract keys and no pagination', async () => {
    await requisicionReportesService.exportarListado({ page: 2, limit: 20, vista: 'mias', estado: 'Cerrada', search: '' });
    const options = mocks.get.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(mocks.get.mock.calls[0][0]).toBe('/requisiciones/export/xlsx');
    expect(options.params).toEqual({ vista: 'mias', estado: 'Cerrada' });
    Object.keys(options.params).forEach((k) => expect(REQUISICION_QUERY_KEYS as readonly string[]).toContain(k));
  });

  it('decodes a JSON error sent as a blob', async () => {
    const body = JSON.stringify({ error: { code: 'EXPORT_DEMASIADAS_FILAS', details: { total: 9000 } } });
    const err = { response: { status: 413, data: new Blob([body]) } };
    mocks.get.mockRejectedValue(err);
    await expect(requisicionReportesService.exportarListado({})).rejects.toBe(err);
    expect(getRequisicionErrorMessage(err)).toContain('9000');
  });

  it('drops empty metric filters', async () => {
    mocks.get.mockResolvedValue({ data: { data: {} } });
    await requisicionReportesService.getMetricas({ desde: '2026-10-01', areaId: '' });
    expect(mocks.get).toHaveBeenCalledWith('/requisiciones/metricas', expect.objectContaining({ params: { desde: '2026-10-01' } }));
  });
});

describe('reportes utils', () => {
  it('builds list paths from an enlace', () => {
    expect(enlaceToPath({ vista: 'oc-por-aprobar' })).toBe('/requisiciones/oc-por-aprobar');
    expect(enlaceToPath({ alcance: 'tenant', filtro: 'licitaciones-abiertas' })).toBe('/requisiciones?alcance=tenant&filtro=licitaciones-abiertas');
    expect(enlaceToPath({ alcance: 'tenant', estado: 'En_Recepcion' })).toBe('/requisiciones?estado=En_Recepcion&alcance=tenant');
    // Allowlist: unknown filtro / alcance / keys are dropped.
    expect(enlaceToPath({ alcance: 'tenant', filtro: 'x', otro: 'y' })).toBe('/requisiciones?alcance=tenant');
    expect(enlaceToPath({ alcance: 'todas', areaId: 'a1' })).toBe('/requisiciones');
    expect(enlaceToPath({ vista: 'mias', estado: 'Cerrada' })).toBe('/requisiciones?estado=Cerrada');
  });

  it('formats cycle hours', () => {
    expect(formatHoras(null)).toBe('—');
    expect(formatHoras(5)).toBe('5 h');
    expect(formatHoras(72)).toBe('3 d');
  });

  it('maps RANGO_INVALIDO and REPORTE_LENTO to Spanish', () => {
    expect(getRequisicionErrorMessage({ response: { data: { error: { code: 'RANGO_INVALIDO' } } } })).toContain('rango de fechas');
    expect(getRequisicionErrorMessage({ response: { data: { error: { code: 'REPORTE_LENTO' } } } })).toContain('tardó demasiado');
  });
});
