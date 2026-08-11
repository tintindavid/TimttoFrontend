import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilenamePreview, buildBulkPdfFilename, resolveTokenValue } from './useFilenamePreview';

const report = {
  consecutivo: 'OT-2026-001-1',
  equipoSnapshot: { Serie: 'SN12345', Inventario: 'INV-777', ItemText: 'MONITOR MULTIPARAMETRO' },
  fechaProcesado: '2026-08-11T14:30:00Z',
};

describe('resolveTokenValue', () => {
  it('resolves the 5 tokens against a populated report', () => {
    expect(resolveTokenValue(report, 'consecutivo')).toBe('OT-2026-001-1');
    expect(resolveTokenValue(report, 'serial')).toBe('SN12345');
    expect(resolveTokenValue(report, 'inventario')).toBe('INV-777');
    expect(resolveTokenValue(report, 'item')).toBe('MONITOR MULTIPARAMETRO');
    expect(resolveTokenValue(report, 'fecha')).toBe('2026-08-11');
  });

  it('renders SN / sin-fecha when values are missing', () => {
    const empty = { equipoSnapshot: {} };
    expect(resolveTokenValue(empty, 'serial')).toBe('SN');
    expect(resolveTokenValue(empty, 'fecha')).toBe('sin-fecha');
  });
});

describe('buildBulkPdfFilename', () => {
  it('composes tokens in order with underscore separator', () => {
    expect(buildBulkPdfFilename(report, ['consecutivo', 'fecha', 'item'])).toBe(
      'OT-2026-001-1_2026-08-11_MONITOR_MULTIPARAMETRO.pdf'
    );
  });

  it('folds accents in the item token', () => {
    const r = { consecutivo: 'OT-1', equipoSnapshot: { ItemText: 'Balón Intraaórtico' } };
    expect(buildBulkPdfFilename(r, ['consecutivo', 'item'])).toBe(
      'OT-1_Balon_Intraaortico.pdf'
    );
  });

  it('returns null on empty token list', () => {
    expect(buildBulkPdfFilename(report, [])).toBeNull();
  });
});

describe('useFilenamePreview', () => {
  it('returns the built filename from the sample report', () => {
    const { result } = renderHook(() =>
      useFilenamePreview(['consecutivo', 'fecha', 'item'], report)
    );
    expect(result.current).toBe('OT-2026-001-1_2026-08-11_MONITOR_MULTIPARAMETRO.pdf');
  });

  it('uses placeholder values when sampleReport is null', () => {
    const { result } = renderHook(() => useFilenamePreview(['consecutivo', 'item'], null));
    expect(result.current).toContain('OT-XXXX-1');
    expect(result.current).toContain('MONITOR');
  });

  it('returns empty string on empty token list', () => {
    const { result } = renderHook(() => useFilenamePreview([], report));
    expect(result.current).toBe('');
  });
});
