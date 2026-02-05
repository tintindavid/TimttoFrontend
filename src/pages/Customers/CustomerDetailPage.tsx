import React, { useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { useCustomer } from '@/hooks/useCustomers';
import CustomerHeader from '@/components/customers/CustomerHeader';
import CustomerSedesSection from '@/components/customers/CustomerSedesSection';
import CustomerServiciosSection from '@/components/customers/CustomerServiciosSection';
import CustomerEquiposSection from '@/components/customers/CustomerEquiposSection';
import CustomerOTsSection from '@/components/customers/CustomerOTsSection';
import { dataQueryOptions } from '@/config/queryClient';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Query optimizada con configuración específica
  const { data, isLoading, error } = useCustomer(id || '', {
    enabled: !!id,
    ...dataQueryOptions.static
  });

  // Memoizar customer para prevenir re-renders
  const customer = useMemo(() => data?.data, [data?.data]);

  // Callback optimizado para navegación
  const handleGoBack = useCallback(() => {
    navigate('/customers');
  }, [navigate]);

  // Early returns optimizados
  if (isLoading && !customer) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando cliente...</span>
        </Spinner>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <Container>
        <Alert variant="danger">
          Error al cargar cliente. 
          <Button variant="link" onClick={handleGoBack}>
            Volver a clientes
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!customer && !isLoading) {
    return (
      <Container>
        <Alert variant="info">
          Cliente no encontrado.
          <Button variant="link" onClick={handleGoBack}>
            Volver a clientes
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!customer) return null;

  return (
    <Container className="py-4">
      {/* Header del Cliente */}
      <CustomerHeader customer={customer} />

      {/* Tabs para las diferentes secciones */}
      <Card className="tt-card mt-4">
        <Card.Body className="p-0">
          <Tabs
            defaultActiveKey="info"
            id="customer-detail-tabs"
            className="p-3 border-bottom"
            variant="pills"
            fill
          >
            {/* Información General */}
            <Tab eventKey="info" title="Información General">
              <div className="p-3">
                <div className="row">
                  <div className="col-md-6">
                    <div><strong>Razón Social:</strong> {customer.Razonsocial}</div>
                    <div><strong>NIT:</strong> {customer.Nit}</div>
                    <div><strong>Email:</strong> {customer.Email || 'N/A'}</div>
                    <div><strong>Ciudad:</strong> {customer.Ciudad || 'N/A'}</div>
                  </div>
                  <div className="col-md-6">
                    <div><strong>Departamento:</strong> {customer.Departamento || 'N/A'}</div>
                    <div><strong>Dirección:</strong> {customer.Direccion || 'N/A'}</div>
                    <div><strong>Teléfono:</strong> {customer.TelContacto || 'N/A'}</div>
                    <div><strong>Contacto:</strong> {customer.UserContacto || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate(`/customers/${customer._id}/edit`)}
                  >
                    Editar Información
                  </Button>
                </div>
              </div>
            </Tab>

            {/* Sedes */}
            <Tab eventKey="sedes" title="Sedes">
              <CustomerSedesSection customerId={customer._id!} />
            </Tab>

            {/* Servicios */}
            <Tab eventKey="servicios" title="Servicios">
              <CustomerServiciosSection customerId={customer._id!} />
            </Tab>

            {/* Equipos */}
            <Tab eventKey="equipos" title="Equipos">
              <CustomerEquiposSection customerId={customer._id!} />
            </Tab>

            {/* Órdenes de Trabajo */}
            <Tab eventKey="ots" title="Órdenes de Trabajo">
              <CustomerOTsSection customerId={customer._id!} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerDetailPage;
