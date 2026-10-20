import React, { useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer.types';
import CrearProveedorModal from '@/components/customers/CrearProveedorModal';

export interface ProveedorValue {
  /** Id of a provider third party (Customer kind=provider). */
  proveedorId?: string;
  /** Free-text provider name, used when no third party is chosen. */
  proveedor?: string;
}

interface Props {
  value: ProveedorValue;
  onChange: (value: ProveedorValue) => void;
  /** DOM id base, so several selectors can live in the same page. */
  controlId?: string;
  label?: string;
}

const OTRO = '__otro__';
const CREAR = '__crear__';

/**
 * Provider picker for external activities and external reports. It always offers a select with the tenant's
 * providers, "Crear proveedor" (opens a dialog that creates the third party and selects it) and "Otro (escribir)"
 * (free-text name, kept for providers that should not be registered).
 */
const ProveedorSelect: React.FC<Props> = ({ value, onChange, controlId = 'act-proveedor', label = 'Proveedor *' }) => {
  // reason: providers per tenant are few; 100 covers the realistic ceiling without paging the select.
  const { data } = useCustomers({ kind: 'provider', limit: 100, sortBy: 'Razonsocial', order: 'asc' });
  const [mostrarCrear, setMostrarCrear] = useState(false);
  // Providers created from this select show up at once, before the list query refetches.
  const [creados, setCreados] = useState<Customer[]>([]);
  const proveedores = useMemo(() => {
    const base = data?.data ?? [];
    return [...base, ...creados.filter((c) => !base.some((b) => b._id === c._id))];
  }, [data?.data, creados]);

  // Free-text mode is derived from the value, so it follows changes made by the parent (e.g. a dialog
  // that loads the activity after mounting). An empty string means "Otro" was chosen but nothing typed yet.
  const modoOtro = !value.proveedorId && value.proveedor !== undefined;
  const seleccion = modoOtro ? OTRO : (value.proveedorId ?? '');

  const handleSelect = (next: string) => {
    if (next === CREAR) {
      setMostrarCrear(true);
      return;
    }
    if (next === OTRO) {
      onChange({ proveedorId: undefined, proveedor: value.proveedor ?? '' });
      return;
    }
    onChange({ proveedorId: next || undefined, proveedor: undefined });
  };

  return (
    <>
      <Form.Group className="mb-3" controlId={controlId}>
        <Form.Label>{label}</Form.Label>
        <Form.Select value={seleccion} onChange={(e) => handleSelect(e.target.value)} aria-label="Proveedor">
          <option value="">Selecciona un proveedor</option>
          {proveedores.map((p) => (
            <option key={p._id} value={p._id}>{p.Razonsocial}</option>
          ))}
          <option value={CREAR}>+ Crear proveedor</option>
          <option value={OTRO}>Otro (escribir)</option>
        </Form.Select>
        {modoOtro && (
          <Form.Control
            className="mt-2"
            placeholder="Nombre del proveedor"
            aria-label="Nombre del proveedor"
            value={value.proveedor ?? ''}
            onChange={(e) => onChange({ proveedorId: undefined, proveedor: e.target.value })}
          />
        )}
      </Form.Group>
      <CrearProveedorModal
        show={mostrarCrear}
        onClose={() => setMostrarCrear(false)}
        onCreated={(provider) => {
          setMostrarCrear(false);
          setCreados((prev) => [...prev, provider]);
          onChange({ proveedorId: provider._id, proveedor: undefined });
        }}
      />
    </>
  );
};

export default ProveedorSelect;
