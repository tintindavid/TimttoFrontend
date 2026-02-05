import React, { useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Badge,
  Table
} from 'react-bootstrap';

import { useProtocol } from '@/hooks/useProtocols';
import { ActividadMtto } from '@/types/actividad.types';

const ProtocolDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 🔹 Cargar protocolo (incluye actividades populadas)
  const {
    data: protocolData,
    isLoading,
    error
  } = useProtocol(id || '');

  // 🔹 Datos seguros SIEMPRE (antes de cualquier return)
  const protocolinfo = protocolData?.data ?? null;
  const protocolId = protocolinfo?._id;

  // 🔹 Actividades seguras (SIEMPRE array)
  const actividades: ActividadMtto[] = protocolinfo?.actividadesMtto ?? [];

  // 🔹 Hooks SIEMPRE arriba (nunca después de returns)
  const stats = useMemo(() => {
    return {
      total: actividades.length,
      obligatorias: actividades.filter(a => a.EsObligatoria).length,
      opcionales: actividades.filter(a => !a.EsObligatoria).length,
      activas: actividades.filter(a => a.Status === 'active').length
    };
  }, [actividades]);

  // 🔹 Navegación (SIN acceder a objetos null)
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!protocolId) return;
    navigate(`/protocols/${protocolId}/edit`);
  }, [navigate, protocolId]);

  const handleCreateActivity = useCallback(() => {
    navigate('/actividades/new');
  }, [navigate]);

  const handleViewProtocols = useCallback(() => {
    navigate('/protocols');
  }, [navigate]);

  // 🔹 Estados base (RETURNS DESPUÉS DE LOS HOOKS)
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
        <span className="ms-2">Cargando protocolo...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Error al cargar el protocolo. Intenta nuevamente.
      </Alert>
    );
  }

  if (!protocolinfo) {
    return (
      <Alert variant="info">
        Protocolo no encontrado.
      </Alert>
    );
  }

  return (
    <Container>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleBack}
            className="mb-2"
          >
            ← Volver
          </Button>
          <h1>Detalle del Protocolo</h1>
        </div>
        <Button
          variant="primary"
          onClick={handleEdit}
          disabled={!protocolId}
        >
          Editar Protocolo
        </Button>
      </div>

      <Row>
        {/* Columna principal */}
        <Col lg={8}>
          {/* Información General */}
          <Card className="tt-card mb-4">
            <Card.Header>
              <h5 className="mb-0">Información General</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <label className="form-label text-muted">Nombre</label>
                  <div className="h5">{protocolinfo.nombre}</div>
                </Col>
                <Col md={6}>
                  <label className="form-label text-muted">Estado</label>
                  <div>
                    <Badge bg="success">Activo</Badge>
                  </div>
                </Col>
              </Row>

              <div className="mt-3">
                <label className="form-label text-muted">Descripción</label>
                <div className="p-3 bg-light rounded">
                  {protocolinfo.Descripcion || (
                    <span className="text-muted fst-italic">
                      Sin descripción
                    </span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Actividades */}
          <Card className="tt-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Actividades de Mantenimiento</h5>
              <Badge bg="info">
                {stats.total} actividad{stats.total !== 1 ? 'es' : ''}
              </Badge>
            </Card.Header>

            <Card.Body className="p-0">
              {actividades.length === 0 ? (
                <Alert variant="warning" className="m-3">
                  <h6>Sin actividades asignadas</h6>
                  <Button variant="primary" onClick={handleEdit}>
                    Agregar Actividades
                  </Button>
                </Alert>
              ) : (
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividades.map((actividad, index) => (
                      <tr key={actividad._id}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold">
                          {actividad.Nombre}
                        </td>
                        <td>
                          {actividad.Descripcion || (
                            <span className="fst-italic text-muted">
                              Sin descripción
                            </span>
                          )}
                        </td>
                        <td>
                          <Badge bg={actividad.EsObligatoria ? 'warning' : 'secondary'}>
                            {actividad.EsObligatoria ? 'Obligatoria' : 'Opcional'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={actividad.Status === 'active' ? 'success' : 'secondary'}>
                            {actividad.Status || 'Sin estado'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          <Card className="tt-card mb-4">
            <Card.Header>
              <h6 className="mb-0">Acciones</h6>
            </Card.Header>
            <Card.Body className="d-grid gap-2">
              <Button
                variant="primary"
                onClick={handleEdit}
                disabled={!protocolId}
              >
                Editar Protocolo
              </Button>
              <Button
                variant="outline-success"
                onClick={handleCreateActivity}
              >
                Crear Nueva Actividad
              </Button>
              <Button
                variant="outline-info"
                onClick={handleViewProtocols}
              >
                Ver Protocolos
              </Button>
            </Card.Body>
          </Card>

          <Card className="tt-card">
            <Card.Header>
              <h6 className="mb-0">Estadísticas</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Total</span>
                <Badge bg="primary">{stats.total}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Obligatorias</span>
                <Badge bg="warning">{stats.obligatorias}</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Opcionales</span>
                <Badge bg="secondary">{stats.opcionales}</Badge>
              </div>
              <div className="d-flex justify-content-between">
                <span>Activas</span>
                <Badge bg="success">{stats.activas}</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProtocolDetailPage;
