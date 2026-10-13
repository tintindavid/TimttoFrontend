import React from 'react';
import { Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { OtraEspecificacion } from '@/types/hvEquipo.types';

interface OtrasEspecificacionesSectionProps {
  isEditing: boolean;
  /** Values being edited (form state) */
  items: OtraEspecificacion[];
  /** Persisted values shown in view mode */
  viewItems: OtraEspecificacion[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: 'nombre' | 'valor', value: string) => void;
}

const OtrasEspecificacionesSection: React.FC<OtrasEspecificacionesSectionProps> = ({
  isEditing,
  items,
  viewItems,
  onAdd,
  onRemove,
  onChange,
}) => {
  if (!isEditing && viewItems.length === 0) return null;

  return (
    <div className="hv-section" data-testid="otras-especificaciones-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="section-header mb-0">Otras Especificaciones</h5>
        {isEditing && (
          <Button variant="primary" size="sm" onClick={onAdd}>
            <FaPlus className="me-1" /> Agregar Especificación
          </Button>
        )}
      </div>

      {isEditing ? (
        items.length > 0 ? (
          <Row className="g-2">
            {items.map((item, index) => (
              <Col key={item._id || index} xs={12} md={6}>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    value={item.nombre}
                    maxLength={200}
                    onChange={(e) => onChange(index, 'nombre', e.target.value)}
                    placeholder="Nombre (Ej: Memoria RAM)"
                    aria-label={`Nombre de la especificación ${index + 1}`}
                  />
                  <Form.Control
                    type="text"
                    value={item.valor}
                    maxLength={500}
                    onChange={(e) => onChange(index, 'valor', e.target.value)}
                    placeholder="Valor (Ej: 16 GB)"
                    aria-label={`Valor de la especificación ${index + 1}`}
                  />
                  <Button
                    variant="danger"
                    onClick={() => onRemove(index)}
                    title="Eliminar"
                    aria-label={`Eliminar especificación ${index + 1}`}
                  >
                    <FaTimes />
                  </Button>
                </InputGroup>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center text-muted">
            No hay especificaciones. Haz clic en "Agregar Especificación" para añadir una.
          </div>
        )
      ) : (
        <Row>
          {viewItems.map((item, index) => (
            <Col key={item._id || index} xs={12} sm={6} md={3}>
              <div className="field-group">
                <label>{item.nombre}:</label>
                <div className="field-value">{item.valor}</div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default OtrasEspecificacionesSection;
