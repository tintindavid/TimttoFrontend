import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DashboardFilters, DashboardPeriodo } from '@/types/dashboard.types';

const PERIODOS: DashboardPeriodo[] = ['mes_actual', 'mes_anterior', 'rango', 'anio'];
const KEYS = ['desde', 'hasta', 'anio', 'clienteId', 'sedeId', 'servicioId', 'tipoMtto', 'tecnicoId'] as const;

/** Dashboard filters live in the URL query string so they survive reloads and can be shared. */
export const useDashboardFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPeriodo = searchParams.get('periodo');
  const periodo: DashboardPeriodo = PERIODOS.includes(rawPeriodo as DashboardPeriodo)
    ? (rawPeriodo as DashboardPeriodo)
    : 'mes_actual';

  const rawKey = KEYS.map((k) => searchParams.get(k) ?? '').join('|');

  const filters = useMemo<DashboardFilters>(() => {
    const f: DashboardFilters = { periodo };
    KEYS.forEach((k, i) => {
      const value = rawKey.split('|')[i];
      if (value) f[k] = value;
    });
    // Date inputs only make sense for their own period kind.
    if (periodo !== 'rango') {
      delete f.desde;
      delete f.hasta;
    }
    if (periodo !== 'anio') delete f.anio;
    return f;
  }, [periodo, rawKey]);

  const setFilter = useCallback(
    (patch: Partial<DashboardFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          });
          // Picking another client invalidates the dependent sede/servicio.
          if ('clienteId' in patch) {
            next.delete('sedeId');
            next.delete('servicioId');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const reset = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  return { filters, setFilter, reset };
};

export default useDashboardFilters;
