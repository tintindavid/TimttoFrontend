import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { TENANT_TYPE_PRESETS, type TenantType } from '@/types';

interface StepTenantTypeProps {
  defaultValue?: TenantType;
  onNext: (type: TenantType) => void;
}

const TYPE_ORDER: TenantType[] = ['provider', 'client', 'hybrid'];

const flagLabel = (enabled: boolean) => (enabled ? 'Sí' : 'No');

const StepTenantType: React.FC<StepTenantTypeProps> = ({ defaultValue = 'provider', onNext }) => {
  const [selected, setSelected] = useState<TenantType>(defaultValue);

  return (
    <div>
      <h5 className="mb-3">Paso 1 — Tipo de organización</h5>
      <p className="text-muted">
        Define qué módulos tendrá la organización. Se puede cambiar después desde el detalle del
        tenant.
      </p>

      <Row className="g-3" role="radiogroup" aria-label="Tipo de organización">
        {TYPE_ORDER.map((type) => {
          const preset = TENANT_TYPE_PRESETS[type];
          const isSelected = selected === type;
          return (
            <Col xs={12} md={4} key={type}>
              <Card
                className={`h-100 ${isSelected ? 'border-primary shadow-sm' : ''}`}
                onClick={() => setSelected(type)}
              >
                <Card.Body>
                  <Form.Check
                    type="radio"
                    id={`tenant-type-${type}`}
                    name="tenant-type"
                    label={<strong>{preset.label}</strong>}
                    checked={isSelected}
                    onChange={() => setSelected(type)}
                  />
                  <p className="text-muted small mt-2">{preset.description}</p>
                  <ul className="list-unstyled small mb-0">
                    <li>Ejecuta servicios: <strong>{flagLabel(preset.executesServices)}</strong></li>
                    <li>Registra mantenimiento de terceros: <strong>{flagLabel(preset.registersExternal)}</strong></li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {selected === 'client' && (
        <Alert variant="info" className="mt-3 mb-0">
          Para una organización Cliente son obligatorios NIT, ciudad, departamento, email y
          teléfono: con ellos se crea su cliente único (“Mi información”) sin logo.
        </Alert>
      )}
      {selected !== 'provider' && (
        <Alert variant="warning" className="mt-3 mb-0">
          El registro de mantenimiento realizado por terceros estará disponible en una versión
          posterior. Por ahora no conviene dar de alta organizaciones cliente reales.
        </Alert>
      )}

      <div className="d-flex justify-content-end mt-4">
        <Button variant="primary" onClick={() => onNext(selected)}>
          Siguiente →
        </Button>
      </div>
    </div>
  );
};

export default StepTenantType;
