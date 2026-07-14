import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { Reporte } from '@/types/reporte.types';

interface ReportSearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Shared search input for the OT-detail report tabs. The three tabs
 * (Listado Total / Pendientes / Cerrados) all filter on the same fields, so
 * the input and the matching helper live here for reuse.
 *
 * Pair with `matchesReportSearch()` below to filter a report list against
 * the current term.
 */
export const ReportSearchBar: React.FC<ReportSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar por item, marca, modelo, serie, inventario, servicio, ubicación...',
  autoFocus,
}) => {
  return (
    <InputGroup>
      <InputGroup.Text>
        <FaSearch />
      </InputGroup.Text>
      <Form.Control
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <InputGroup.Text
          role="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          style={{ cursor: 'pointer' }}
        >
          <FaTimes />
        </InputGroup.Text>
      )}
    </InputGroup>
  );
};

/**
 * Case-insensitive substring match across every equipment field the technician
 * uses to locate a report. Returns true when the term is empty so callers can
 * safely `reportes.filter(r => matchesReportSearch(r, term))` regardless of
 * whether the input is populated.
 */
export function matchesReportSearch(reporte: Reporte, rawTerm: string): boolean {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return true;

  const snapshot = reporte.equipoSnapshot || ({} as Reporte['equipoSnapshot']);
  const haystack = [
    snapshot.ItemText,
    snapshot.Marca,
    snapshot.Modelo,
    snapshot.Serie,
    snapshot.Inventario,
    snapshot.Servicio,
    snapshot.Ubicacion,
    snapshot.Sede,
    reporte.consecutivo,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return haystack.some((field) => field.includes(term));
}

export default ReportSearchBar;
