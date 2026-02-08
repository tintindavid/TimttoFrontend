import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, Card, Row, Col, Badge, Alert, 
  ProgressBar, ListGroup, Button 
} from 'react-bootstrap';
import { FaCheckCircle, FaPrint, FaSpinner } from 'react-icons/fa';
import { useReporte } from '@/hooks/useReportes';
import { useRepuestosByReporte } from '@/hooks/useRepuestos';
import '@/pages/Reports/ViewReportPage.css';

const ViewReportPage: React.FC = () => {
  const { reporteId } = useParams<{ reporteId: string }>();
  const { data: reporteData, isLoading: loadingReporte } = useReporte(reporteId || '');
  const { data: repuestosData, isLoading: loadingRepuestos } = useRepuestosByReporte(reporteId || '');

  const [actividadesCompletadas, setActividadesCompletadas] = useState(0);
  const [totalActividades, setTotalActividades] = useState(0);
  const [progresoActividades, setProgresoActividades] = useState(0);

  const reporte = reporteData?.data;
  const repuestos = repuestosData?.data || [];

  console.log('Reporte data:', reporte);
  // Debug: verificar estadoOperativo
  useEffect(() => {
    if (reporte) {
      console.log('Reporte estadoOperativo:', reporte.estadoOperativo);
      console.log('Reporte completo:', reporte);
    }
  }, [reporte]);

  useEffect(() => {
    if (reporte?.actividadesRealizadas) {
      const completadas = reporte.actividadesRealizadas.length;
      const total = reporte.actividadesRealizadas.length; // Ajustar según lógica real
      setActividadesCompletadas(completadas);
      setTotalActividades(total);
      setProgresoActividades(total > 0 ? (completadas / total) * 100 : 0);
    }
  }, [reporte]);

  if (loadingReporte) {
    return (
      <Container className="mt-5 text-center">
        <FaSpinner className="fa-spin" size={40} />
        <p className="mt-3">Cargando reporte...</p>
      </Container>
    );
  }

  if (!reporte) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          No se pudo cargar el reporte. Verifique el ID e intente nuevamente.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="view-report-page py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>📋 Reporte de Mantenimiento</h3>
          <p className="text-muted mb-0">
            Equipo: {reporte.equipoSnapshot?.ItemText || 'N/A'}
          </p>
        </div>
        <Button variant="primary" onClick={() => window.print()}>
          <FaPrint className="me-2" />
          Imprimir
        </Button>
      </div>

      {/* Información General */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">📋 Información General</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-3">
                <strong>Estado:</strong>{' '}
                <Badge bg={reporte.procesado ? 'success' : 'warning'}>
                  {reporte.estado}
                </Badge>
              </div>
              <div className="mb-3">
                <strong>Fecha de Creación:</strong>{' '}
                {reporte.createdAt ? new Date(reporte.createdAt).toLocaleString('es-ES') : 'N/A'}
              </div>
              <div className="mb-3">
                <strong>Fecha de Procesado:</strong>{' '}
                {reporte.fechaProcesado ? new Date(reporte.fechaProcesado).toLocaleString('es-ES') : 'No procesado'}
              </div>
            </Col>
            <Col md={6}>
              {/* Estado Operativo Destacado - SIEMPRE VISIBLE */}
              <div className="mb-4 p-3 rounded" style={{
                backgroundColor: 
                  reporte.estadoOperativo === 'Operativo' ? '#d4edda' :
                  reporte.estadoOperativo === 'En Mantenimiento' ? '#fff3cd' :
                  reporte.estadoOperativo === 'Fuera de Servicio' ? '#f8d7da' :
                  reporte.estadoOperativo === 'Dado de Baja' ? '#e2e3e5' :
                  '#f8f9fa',
                border: '2px solid ' + (
                  reporte.estadoOperativo === 'Operativo' ? '#28a745' :
                  reporte.estadoOperativo === 'En Mantenimiento' ? '#ffc107' :
                  reporte.estadoOperativo === 'Fuera de Servicio' ? '#dc3545' :
                  reporte.estadoOperativo === 'Dado de Baja' ? '#6c757d' :
                  '#dee2e6'
                )
              }}>
                <div className="text-center">
                  <small className="text-muted d-block mb-1">Estado Final del Equipo</small>
                  <h4 className="mb-0" style={{
                    color: 
                      reporte.estadoOperativo === 'Operativo' ? '#155724' :
                      reporte.estadoOperativo === 'En Mantenimiento' ? '#856404' :
                      reporte.estadoOperativo === 'Fuera de Servicio' ? '#721c24' :
                      reporte.estadoOperativo === 'Dado de Baja' ? '#383d41' :
                      '#6c757d',
                    fontWeight: 'bold'
                  }}>
                    {reporte.estadoOperativo === 'Operativo' ? '✅' :
                     reporte.estadoOperativo === 'En Mantenimiento' ? '🔧' :
                     reporte.estadoOperativo === 'Fuera de Servicio' ? '⚠️' :
                     reporte.estadoOperativo === 'Dado de Baja' ? '🔴' :
                     '❓'}
                    {' '}{reporte.estadoOperativo || 'No especificado'}
                  </h4>
                </div>
              </div>
              {reporte.ResponsableMtto && (
                <div className="mb-3">
                  <strong>Responsable:</strong>{' '}
                  {typeof reporte.ResponsableMtto === 'object' 
                    ? `${reporte.ResponsableMtto.firstName} ${reporte.ResponsableMtto.lastName}`
                    : reporte.ResponsableMtto
                  }
                </div>
              )}
              <div className="mb-3">
                <strong>Progreso de Actividades:</strong>
                <ProgressBar 
                  now={progresoActividades} 
                  label={`${Math.round(progresoActividades)}%`}
                  variant={progresoActividades === 100 ? 'success' : 'info'}
                  className="mt-2"
                  style={{ height: '25px' }}
                />
                <small className="text-muted">
                  {actividadesCompletadas}/{totalActividades} actividades completadas
                </small>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Información del Equipo */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">📱 Información del Equipo</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-2"><strong>Nombre:</strong> {reporte.equipoSnapshot?.ItemText || 'N/A'}</div>
              <div className="mb-2"><strong>Marca:</strong> {reporte.equipoSnapshot?.Marca || 'N/A'}</div>
              <div className="mb-2"><strong>Modelo:</strong> {reporte.equipoSnapshot?.Modelo || 'N/A'}</div>
            </Col>
            <Col md={6}>
              <div className="mb-2"><strong>Serie:</strong> {reporte.equipoSnapshot?.Serie || 'N/A'}</div>
              <div className="mb-2"><strong>Servicio:</strong> {reporte.equipoSnapshot?.Servicio || 'N/A'}</div>
              <div className="mb-2"><strong>Ubicación:</strong> {reporte.equipoSnapshot?.Ubicacion || 'N/A'}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Actividades Realizadas */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0">
            ✅ Actividades Realizadas ({actividadesCompletadas}/{totalActividades})
          </h5>
        </Card.Header>
        <Card.Body>
          {reporte.actividadesRealizadas && reporte.actividadesRealizadas.length > 0 ? (
            <ListGroup>
              {reporte.actividadesRealizadas.map((actividad, index) => (
                <ListGroup.Item key={index} className="border-start border-success border-3">
                  <div className="d-flex align-items-start">
                    <FaCheckCircle className="text-success me-3 mt-1" size={20} />
                    <div className="flex-grow-1">
                      <div className="fw-bold">{actividad.descripcion}</div>
                      {actividad.fecha && (
                        <small className="text-muted d-block mt-1">
                          Fecha: {new Date(actividad.fecha).toLocaleDateString('es-ES')}
                        </small>
                      )}
                      {actividad.observaciones && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small>
                            <strong>Observaciones:</strong> {actividad.observaciones}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info" className="mb-0">
              No se registraron actividades
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Repuestos */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            🔧 Repuestos Utilizados ({repuestos.length})
          </h5>
        </Card.Header>
        <Card.Body>
          {repuestos.length > 0 ? (
            <ListGroup>
              {repuestos.map((repuesto) => (
                <ListGroup.Item key={repuesto._id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-bold">{repuesto.nombre}</div>
                      <small className="text-muted d-block mt-1">
                        Cantidad: {repuesto.Cantidad}
                        {repuesto.PrecioRepuesto && ` • Precio: ${repuesto.PrecioRepuesto} ${repuesto.Currency}`}
                      </small>
                      {repuesto.observacion && (
                        <div className="mt-2">
                          <small className="text-muted">{repuesto.observacion}</small>
                        </div>
                      )}
                    </div>
                    <Badge bg={
                      repuesto.EstadoSolicitud === 'Instalado' ? 'success' :
                      repuesto.EstadoSolicitud === 'Aprobado' ? 'info' : 'warning'
                    }>
                      {repuesto.EstadoSolicitud}
                    </Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info" className="mb-0">
              No se utilizaron repuestos
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Observaciones */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">📝 Observaciones y Diagnóstico</h5>
        </Card.Header>
        <Card.Body>
          {reporte.fallaReportada && (
            <div className="mb-3">
              <strong className="d-block mb-2">🔴 Falla Reportada:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded border-start border-danger border-3">
                {reporte.fallaReportada}
              </p>
            </div>
          )}
          {reporte.diagnostico && (
            <div className="mb-3">
              <strong className="d-block mb-2">🔍 Diagnóstico:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded border-start border-info border-3">
                {reporte.diagnostico}
              </p>
            </div>
          )}
          {reporte.accionTomada && (
            <div className="mb-3">
              <strong className="d-block mb-2">🔧 Acción Tomada:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded border-start border-success border-3">
                {reporte.accionTomada}
              </p>
            </div>
          )}
          {reporte.causaEncontrada && (
            <div className="mb-3">
              <strong className="d-block mb-2">Causa Encontrada:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded">{reporte.causaEncontrada}</p>
            </div>
          )}
          {reporte.motivoFueraServicio && (
            <div className="mb-3">
              <strong className="d-block mb-2">Motivo Fuera de Servicio:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded">{reporte.motivoFueraServicio}</p>
            </div>
          )}
          {reporte.observacion && (
            <div className="mb-3">
              <strong className="d-block mb-2">Observaciones Generales:</strong>
              <p className="text-muted mb-0 p-3 bg-light rounded">{reporte.observacion}</p>
            </div>
          )}
          {reporte.observacionEstadoFinal && (
            <div className="mb-3">
              <strong className="d-block mb-2">Observación Estado Final:</strong>
              <p className="text-muted mb-0 p-3 bg-warning bg-opacity-10 rounded border-start border-warning border-3">
                {reporte.observacionEstadoFinal}
              </p>
            </div>
          )}
          {!reporte.fallaReportada && !reporte.diagnostico && !reporte.accionTomada && !reporte.causaEncontrada && !reporte.motivoFueraServicio && !reporte.observacion && !reporte.observacionEstadoFinal && (
            <Alert variant="info" className="mb-0">
              No se registraron observaciones
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Evidencias */}
      {reporte.evidencias && reporte.evidencias.length > 0 && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">
              📷 Evidencias Fotográficas ({reporte.evidencias.length})
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {reporte.evidencias.map((evidencia, index) => (
                <Col md={4} key={index} className="mb-3">
                  <Card className="shadow-sm">
                    <Card.Img 
                      variant="top" 
                      src={evidencia.url} 
                      style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => window.open(evidencia.url, '_blank')}
                      alt={evidencia.nombre}
                    />
                    <Card.Body className="p-2">
                      <small className="text-muted d-block">{evidencia.nombre}</small>
                      <small className="text-muted">
                        {new Date(evidencia.fechaSubida).toLocaleDateString('es-ES')}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ViewReportPage;
