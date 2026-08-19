import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { EquipoItem } from '@/types/equipoItem.types';

interface EquipoDuplicateModalProps {
  show: boolean;
  onHide: () => void;
  existing: EquipoItem;
  /** Semantics owned by the caller: attach to OT, reuse, navigate, etc. */
  onUseExisting?: (existing: EquipoItem) => void;
  /** Default: "Usar este equipo". */
  primaryLabel?: string;
  /** When true, hides the primary action — used by the bulk upload preview. */
  readOnly?: boolean;
}

const formatDate = (value?: string): string => {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return date.toLocaleDateString('es-CO');
};

const EquipoDuplicateModal: React.FC<EquipoDuplicateModalProps> = ({
  show,
  onHide,
  existing,
  onUseExisting,
  primaryLabel = 'Usar este equipo',
  readOnly = false,
}) => {
  const nombre = existing.ItemId?.Nombre || 'Equipo sin nombre';
  const tieneHV = Boolean((existing as unknown as { TieneHV?: boolean }).TieneHV);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Equipo ya existente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          Ya existe un equipo con el mismo ítem, marca y serie para este cliente. Puedes usar el
          equipo existente o cancelar y editar los campos para crear uno distinto.
        </p>

        <div className="mb-3">
          <h5 className="mb-1 d-flex align-items-center gap-2">
            {nombre}
            {tieneHV && (
              <Badge bg="info" pill>
                Tiene HV
              </Badge>
            )}
          </h5>
          <div className="text-muted">
            {existing.Marca || 'Sin marca'} {existing.Modelo ? `· ${existing.Modelo}` : ''}
            {existing.Serie ? ` · Serie: ${existing.Serie}` : ''}
          </div>
        </div>

        <Row className="g-3">
          <Col md={6}>
            <div className="small text-muted">Sede</div>
            <div>{existing.SedeId?.nombreSede || 'N/A'}</div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">Servicio</div>
            <div>{existing.Servicio?.nombre || 'N/A'}</div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">Ubicación</div>
            <div>{existing.Ubicacion || 'N/A'}</div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">Estado</div>
            <div>{existing.Estado || 'N/A'}</div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">Último mantenimiento</div>
            <div>{formatDate(existing.UltimoMtto)}</div>
          </Col>
        </Row>

        {existing._id && (
          <div className="mt-3">
            <Link to={`/hv-equipo/${existing._id}`}>Abrir hoja de vida</Link>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancelar y editar
        </Button>
        {!readOnly && (
          <Button variant="primary" onClick={() => onUseExisting?.(existing)}>
            {primaryLabel}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EquipoDuplicateModal;
