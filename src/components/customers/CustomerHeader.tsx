import React from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer.types';

interface CustomerHeaderProps {
  customer: Customer;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer }) => {
  const navigate = useNavigate();

  return (
    <Card className="tt-card">
      <Card.Body>
        <Row className="align-items-center">
          <Col>
            <div className="d-flex align-items-center gap-3">
              {customer.Logo && (
                <div 
                  className="bg-light rounded d-flex align-items-center justify-content-center"
                  style={{ width: 60, height: 60 }}
                >
                  <img 
                    src={customer.Logo} 
                    alt="Logo" 
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <h1 className="mb-1">{customer.Razonsocial}</h1>
                <div className="text-muted">
                  <span className="me-3">NIT: {customer.Nit}</span>
                  {customer.Status && (
                    <Badge 
                      bg={customer.Status === 'Active' ? 'success' : 'secondary'}
                    >
                      {customer.Status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/customers/${customer._id}/edit`)}
              >
                Editar Cliente
              </Button>
            </div>
          </Col>
        </Row>

        {/* Información de contacto rápida */}
        <Row className="mt-3 pt-3 border-top">
          <Col md={6}>
            <div className="small text-muted">
              <div><strong>Email:</strong> {customer.Email || 'N/A'}</div>
              <div><strong>Ciudad:</strong> {customer.Ciudad || 'N/A'}</div>
            </div>
          </Col>
          <Col md={6}>
            <div className="small text-muted">
              <div><strong>Teléfono:</strong> {customer.TelContacto || 'N/A'}</div>
              <div><strong>Contacto:</strong> {customer.UserContacto || 'N/A'}</div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CustomerHeader;