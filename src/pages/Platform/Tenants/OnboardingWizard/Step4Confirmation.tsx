import React from 'react';
import { Row, Col, Card, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { FaBuilding, FaUser, FaImage } from 'react-icons/fa';
import type { WizardFormData } from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Step4Props {
  formData: WizardFormData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// Helper: display a field row only if value is set
// ---------------------------------------------------------------------------
const FieldRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <ListGroup.Item className="px-0 py-1 border-0 d-flex justify-content-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </ListGroup.Item>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Step4Confirmation: React.FC<Step4Props> = ({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  const { tenant, admin, logoFile } = formData;

  return (
    <div>
      <h5 className="mb-4">Paso 4 — Confirmar y crear</h5>

      <Alert variant="info" className="mb-4">
        Revisa la información antes de crear el tenant. Una vez creado, el ID del tenant no
        puede cambiar.
      </Alert>

      <Row className="g-3 mb-4">
        {/* Tenant summary */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex align-items-center gap-2">
              <FaBuilding aria-hidden="true" />
              Datos del tenant
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <FieldRow label="ID" value={tenant.tenantId} />
                <FieldRow label="Nombre" value={tenant.name} />
                <FieldRow label="Slogan" value={tenant.slogan} />
                <FieldRow label="NIT" value={tenant.nit} />
                <FieldRow label="Email" value={tenant.email} />
                <FieldRow label="Teléfono" value={tenant.telefono} />
                <FieldRow label="Dirección" value={tenant.direccion} />
                <FieldRow label="Ciudad" value={tenant.ciudad} />
                <FieldRow label="Departamento" value={tenant.departamento} />
                <FieldRow label="País" value={tenant.pais} />
                <FieldRow label="Sitio web" value={tenant.website} />
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Admin summary */}
        <Col md={6}>
          <Card>
            <Card.Header className="d-flex align-items-center gap-2">
              <FaUser aria-hidden="true" />
              Datos del primer administrador
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <FieldRow label="Nombre" value={`${admin.firstName} ${admin.lastName}`} />
                <FieldRow label="Email" value={admin.email} />
              </ListGroup>
              <small className="text-muted">
                La contraseña temporal se generará automáticamente y se mostrará una sola vez.
              </small>
            </Card.Body>
          </Card>

          {/* Logo summary */}
          <Card className="mt-3">
            <Card.Header className="d-flex align-items-center gap-2">
              <FaImage aria-hidden="true" />
              Logo
            </Card.Header>
            <Card.Body>
              {logoFile ? (
                <span className="text-success">
                  {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span className="text-muted">Sin logo (se puede agregar después)</span>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-2">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          ← Anterior
        </Button>
        <Button
          variant="success"
          onClick={onSubmit}
          disabled={isSubmitting}
          aria-label="Crear tenant"
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                size="sm"
                animation="border"
                aria-hidden="true"
                className="me-1"
              />
              Creando…
            </>
          ) : (
            'Crear tenant'
          )}
        </Button>
      </div>
    </div>
  );
};

export default Step4Confirmation;
