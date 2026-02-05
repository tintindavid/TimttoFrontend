import { useState, useEffect, useMemo } from 'react';

/**
 * Hook personalizado para implementar debounce en búsquedas
 * Reduce las llamadas API al esperar que el usuario termine de escribir
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce específico de búsquedas
 * Incluye lógica adicional para manejar strings vacíos
 */
export const useSearchDebounce = (searchTerm: string, delay: number = 800) => {
  const debouncedSearch = useDebounce(searchTerm, delay);
  
  // Solo retornar el valor si tiene al menos 2 caracteres
  // Esto evita búsquedas con muy pocos caracteres
  return useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      return '';
    }
    return debouncedSearch.trim();
  }, [debouncedSearch]);
};

/**
 * Hook para manejar múltiples filtros con debounce
 * Útil para componentes con múltiples campos de filtro
 */
export const useFiltersDebounce = (filters: Record<string, any>, delay: number = 600) => {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, delay]);

  // Solo incluir filtros que tienen valor
  return useMemo(() => {
    return Object.entries(debouncedFilters).reduce((acc, [key, value]) => {
      if (value && value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }, [debouncedFilters]);
};

export default useDebounce;