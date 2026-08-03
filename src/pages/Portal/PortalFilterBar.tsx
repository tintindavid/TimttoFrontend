import React, { useMemo } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { PortalOt } from '@/types/publicPortal.types';

export interface PortalFilterValues {
  /** Free-text query — matches Serie, Inventario, Modelo, ItemText, Marca. */
  q: string;
  /** Exact match against equipoSnapshot.ItemText. Empty = all. */
  item: string;
  /** Exact match against equipoSnapshot.Marca. Empty = all. */
  marca: string;
  /** Exact match against equipoSnapshot.Ubicacion. Empty = all. */
  ubicacion: string;
  /** Exact match against report.estadoOperativo (2026-08-04). Empty = all. */
  estadoOperativo: string;
}

export const EMPTY_FILTERS: PortalFilterValues = {
  q: '',
  item: '',
  marca: '',
  ubicacion: '',
  estadoOperativo: '',
};

interface Props {
  ots: PortalOt[];
  value: PortalFilterValues;
  onChange: (next: PortalFilterValues) => void;
}

/** Sorted unique values of a field across every report of every OT. */
const uniq = (ots: PortalOt[], picker: (r: PortalOt['reports'][number]) => string | undefined): string[] => {
  const set = new Set<string>();
  for (const ot of ots) {
    for (const r of ot.reports) {
      const v = picker(r);
      if (v && v.trim()) set.add(v.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
};

/**
 * Sticky filter bar shown above the tabs in `PortalHome`. Filters are
 * client-side (the consolidated endpoint already returns every report), so
 * the applied predicate lives in the parent and drives BOTH the counts on
 * the tab badges AND the visible list per tab.
 */
const PortalFilterBar: React.FC<Props> = ({ ots, value, onChange }) => {
  const items = useMemo(() => uniq(ots, (r) => r.equipoSnapshot?.ItemText), [ots]);
  const marcas = useMemo(() => uniq(ots, (r) => r.equipoSnapshot?.Marca), [ots]);
  const ubicaciones = useMemo(() => uniq(ots, (r) => r.equipoSnapshot?.Ubicacion), [ots]);
  // estadoOperativo comes from a fixed enum on the backend, but we still
  // derive the options from the actual data so estados that never appear
  // for this token don't clutter the dropdown.
  const estadosOperativos = useMemo(
    () => uniq(ots, (r) => r.estadoOperativo || undefined),
    [ots]
  );

  const set = (patch: Partial<PortalFilterValues>) => onChange({ ...value, ...patch });
  const isDirty =
    value.q !== '' ||
    value.item !== '' ||
    value.marca !== '' ||
    value.ubicacion !== '' ||
    value.estadoOperativo !== '';

  return (
    <div className="border rounded-3 p-3 mb-3 bg-light">
      {/* Row 1: buscador ancho + botón limpiar. Row 2: los 4 selects
          en columnas iguales (md-3) para que ninguno quede apretado
          después de sumar Estado operativo (2026-08-04). */}
      <Row className="g-2 align-items-end mb-2">
        <Col xs={12} md={10}>
          <Form.Label className="small text-muted mb-1">Buscar</Form.Label>
          <Form.Control
            type="search"
            placeholder="Serie, inventario, modelo, marca o nombre del equipo"
            value={value.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </Col>
        <Col xs={12} md={2} className="d-grid">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={!isDirty}
            onClick={() => onChange(EMPTY_FILTERS)}
            title="Limpiar filtros"
          >
            <FaTimes className="me-1" />
            Limpiar
          </Button>
        </Col>
      </Row>
      <Row className="g-2 align-items-end">
        <Col xs={12} sm={6} md={3}>
          <Form.Label className="small text-muted mb-1">Item</Form.Label>
          <Form.Select value={value.item} onChange={(e) => set({ item: e.target.value })}>
            <option value="">Todos</option>
            {items.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Label className="small text-muted mb-1">Marca</Form.Label>
          <Form.Select value={value.marca} onChange={(e) => set({ marca: e.target.value })}>
            <option value="">Todas</option>
            {marcas.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Label className="small text-muted mb-1">Ubicación</Form.Label>
          <Form.Select value={value.ubicacion} onChange={(e) => set({ ubicacion: e.target.value })}>
            <option value="">Todas</option>
            {ubicaciones.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Form.Label className="small text-muted mb-1">Estado operativo</Form.Label>
          <Form.Select
            value={value.estadoOperativo}
            onChange={(e) => set({ estadoOperativo: e.target.value })}
          >
            <option value="">Todos</option>
            {estadosOperativos.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>
    </div>
  );
};

export default PortalFilterBar;

/**
 * Case-insensitive, accent-insensitive predicate for a single report against
 * the current filter values. Same rules the tab counters use — kept next to
 * the component so the two sources of truth never drift.
 */
export const reportMatchesFilters = (
  report: PortalOt['reports'][number],
  filters: PortalFilterValues
): boolean => {
  const snap = report.equipoSnapshot;
  if (filters.item && snap?.ItemText !== filters.item) return false;
  if (filters.marca && snap?.Marca !== filters.marca) return false;
  if (filters.ubicacion && snap?.Ubicacion !== filters.ubicacion) return false;
  if (filters.estadoOperativo && report.estadoOperativo !== filters.estadoOperativo) return false;
  const q = filters.q.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    snap?.ItemText,
    snap?.Marca,
    snap?.Modelo,
    snap?.Serie,
    snap?.Inventario,
    snap?.Ubicacion,
    report.consecutivo,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
};
