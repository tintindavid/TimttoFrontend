import React, { useState, useMemo } from 'react';
import { 
  Button, Table, Badge, Row, Col, 
  Spinner, Alert, Form, Card 
} from 'react-bootstrap';
import { useOTs } from '@/hooks/useOTs';
import { OT } from '@/types/ot.types';

interface CustomerOTsSectionProps {
  customerId: string;
}

const CustomerOTsSection: React.FC<CustomerOTsSectionProps> = ({ customerId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useOTs({
    ClienteId: customerId,
    search: searchTerm || undefined,
    EstadoOt: statusFilter || undefined,
    page,
    limit: 20
  });

  const ots = data?.data || [];
  const pagination = data?.pagination;

  // Estadísticas
  const stats = useMemo(() => {
    const total = ots.length;
    const completadas = ots.filter(ot => ot.EstadoOt === 'Completada').length;
    const pendientes = ots.filter(ot => ot.EstadoOt === 'Pendiente').length;
    const enProceso = ots.filter(ot => ot.EstadoOt === 'En Proceso').length;
    
    return { total, completadas, pendientes, enProceso };
  }, [ots]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger">
          Error al cargar las órdenes de trabajo del cliente
        </Alert>
        {/* Mostrar estadísticas vacías para mantener la estructura */}
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="mb-0 text-muted">-</h4>
                <small className="text-muted">Total OTs</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="mb-0 text-muted">-</h4>
                <small className="text-muted">Completadas</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="mb-0 text-muted">-</h4>
                <small className="text-muted">En Proceso</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h4 className="mb-0 text-muted">-</h4>
                <small className="text-muted">Pendientes</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Estadísticas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="mb-0 text-primary">{stats.total}</h4>
              <small className="text-muted">Total OTs</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="mb-0 text-success">{stats.completadas}</h4>
              <small className="text-muted">Completadas</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="mb-0 text-warning">{stats.enProceso}</h4>
              <small className="text-muted">En Proceso</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h4 className="mb-0 text-danger">{stats.pendientes}</h4>
              <small className="text-muted">Pendientes</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar OTs</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por número de orden, consecutivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lista de OTs */}
      {ots.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h6>No hay órdenes de trabajo</h6>
          <p className="mb-0">
            No se encontraron órdenes de trabajo para este cliente.
          </p>
        </Alert>
      ) : (
        <>
          <div className="table-responsive">
            <Table hover>
              <thead className="table-light">
                <tr>
                  <th>Número OT</th>
                  <th>Consecutivo</th>
                  <th>Tipo de Servicio</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Fecha Creación</th>
                  <th>Responsable</th>
                  <th>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {ots.map((ot) => (
                  <tr key={ot._id}>
                    <td>
                      <div>
                        <strong>{ot.numeroOt || ot.Norden || 'N/A'}</strong>
                        {ot.OTPK && (
                          <div className="text-muted small">
                            ID: {ot.OTPK}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{ot.Consecutivo || 'N/A'}</td>
                    <td>{ot.TipoServicio || 'N/A'}</td>
                    <td>
                      <Badge bg={getOtStatusColor(ot.EstadoOt)}>
                        {ot.EstadoOt || 'N/A'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="progress me-2" 
                          style={{ width: 60, height: 8 }}
                        >
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${getAvanceValue(ot.Avance)}%`,
                              backgroundColor: getAvanceColor(ot.Avance)
                            }}
                          />
                        </div>
                        <small>{getAvanceValue(ot.Avance)}%</small>
                      </div>
                    </td>
                    <td>
                      {ot.FechaCreacion ? (
                        <small>
                          {new Date(ot.FechaCreacion).toLocaleDateString('es-ES')}
                        </small>
                      ) : (
                        <span className="text-muted">Sin fecha</span>
                      )}
                    </td>
                    <td>
                      {ot.ResponsableId ? (
                        <small>{ot.ResponsableId}</small>
                      ) : (
                        <span className="text-muted">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      {ot.OtPrioridad && (
                        <Badge bg={getPriorityColor(ot.OtPrioridad)}>
                          {ot.OtPrioridad}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Paginación simple */}
          {pagination && pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="align-self-center mx-3">
                  Página {page} de {pagination.pages}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Funciones auxiliares
const getOtStatusColor = (status?: string) => {
  switch (status) {
    case 'Completada': return 'success';
    case 'En Proceso': return 'warning';
    case 'Pendiente': return 'info';
    case 'Cancelada': return 'danger';
    default: return 'secondary';
  }
};

const getAvanceValue = (avance?: number | string): number => {
  if (typeof avance === 'number') return avance;
  if (typeof avance === 'string') return parseFloat(avance) || 0;
  return 0;
};

const getAvanceColor = (avance?: number | string): string => {
  const value = getAvanceValue(avance);
  if (value >= 100) return '#28a745';
  if (value >= 75) return '#20c997';
  if (value >= 50) return '#ffc107';
  if (value >= 25) return '#fd7e14';
  return '#dc3545';
};

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'alta': return 'danger';
    case 'media': return 'warning';
    case 'baja': return 'success';
    default: return 'secondary';
  }
};

export default CustomerOTsSection;