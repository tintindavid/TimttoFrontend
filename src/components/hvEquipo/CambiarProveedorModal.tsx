import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import type { ActividadExterna, UpdateActividadDto } from '@/types/actividadExterna.types';
import ProveedorSelect, { type ProveedorValue } from './ProveedorSelect';

interface Props {
  actividad: ActividadExterna | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (dto: UpdateActividadDto) => void;
}

/** Changes only the provider of an existing external activity (the rest of the record is immutable). */
const CambiarProveedorModal: React.FC<Props> = ({ actividad, saving = false, onClose, onSave }) => {
  const [value, setValue] = useState<ProveedorValue>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (actividad) {
      setValue(actividad.proveedorId ? { proveedorId: actividad.proveedorId } : { proveedor: actividad.proveedor });
      setErr(null);
    }
  }, [actividad]);

  const submit = () => {
    const nombre = value.proveedor?.trim();
    if (!value.proveedorId && !nombre) {
      setErr('Selecciona un proveedor o escribe el nombre.');
      return;
    }
    // A linked provider overrides the name server-side; free text replaces any previous link.
    onSave(value.proveedorId ? { proveedorId: value.proveedorId } : { proveedor: nombre });
  };

  return (
    <Modal show={!!actividad} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cambiar proveedor</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {actividad && (
          <p className="text-muted small">
            Actividad {actividad.consecutivoExterno} · proveedor actual: <strong>{actividad.proveedor}</strong>
          </p>
        )}
        {err && <Alert variant="danger">{err}</Alert>}
        <ProveedorSelect controlId="cambiar-proveedor" value={value} onChange={setValue} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={submit} disabled={saving}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CambiarProveedorModal;
