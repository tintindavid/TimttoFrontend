import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, Card, Row, Col, Badge, Alert, 
  ProgressBar, ListGroup, Button 
} from 'react-bootstrap';
import { FaCheckCircle, FaFilePdf, FaSpinner } from 'react-icons/fa';
import { downloadReportPDF } from '@/services/descargarPdf.service';
import { useReporte } from '@/hooks/useReportes';
import { useRepuestosByReporte } from '@/hooks/useRepuestos';
import ImageGalleryModal from '@/components/common/ImageGalleryModal';
import '@/pages/Reports/ViewReportPage.css';

const ViewReportPage: React.FC = () => {
  const { reporteId } = useParams<{ reporteId: string }>();
  const navigate = useNavigate();
  const { data: reporteData, isLoading: loadingReporte } = useReporte(reporteId || '');
  const { data: repuestosData, isLoading: loadingRepuestos } = useRepuestosByReporte(reporteId || '');

  const [actividadesCompletadas, setActividadesCompletadas] = useState(0);
  const [totalActividades, setTotalActividades] = useState(0);
  const [progresoActividades, setProgresoActividades] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [galleryStartIndex, setGalleryStartIndex] = useState<number | null>(null);

  const reporte = reporteData?.data;
  const repuestos = repuestosData?.data || [];
  const repuestosPendientes = repuestos.filter((r: any) => r.EstadoSolicitud === 'En Proceso');
  const repuestosInstalados = repuestos.filter((r: any) => r.EstadoSolicitud === 'Instalado');

  console.log('Reporte data:', reporte);
  // Debug: verificar estadoOperativo
  useEffect(() => {
    if (reporte) {
      console.log('Reporte estadoOperativo:', reporte.estadoOperativo);
      console.log('Reporte completo:', reporte);
    }
  }, [reporte]);

  const handleDownloadPdf = async () => {
    if (!reporteId) return;
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      await downloadReportPDF(reporteId);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Error al generar el PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

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
          <h3>📋 Reporte de Mantenimiento <strong>{reporte.tipoMtto}</strong> </h3>
          <p className="text-muted mb-0">
            Equipo: {reporte.equipoSnapshot?.ItemText || 'N/A'}
          </p>
        </div>
        {/**Boton para redirigir a la pagina de hoja de vida del equipo hv-equipo/69fa35657d19fe44f233bd47 */}
        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            onClick={() => window.open(`/hv-equipo/${reporte.Equipo?._id}`, '_blank')}
          >
            Ver HV
          </Button>
          <Button variant="danger" onClick={handleDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <><FaSpinner className="fa-spin me-2" />Generando PDF...</>
            ) : (
              <><FaFilePdf className="me-2" />Descargar PDF</>
            )}
          </Button>
        </div>
      </div>

      {pdfError && (
        <Alert variant="danger" dismissible onClose={() => setPdfError(null)} className="mb-4">
          {pdfError}
        </Alert>
      )}

            {/* Sección de Información General del Reporte */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Consecutivo</small>
              </div>
              <div className="display-6 fw-bold text-primary">
                {reporte.consecutivo || 'N/A'}
              </div>
              <div className="text-muted mt-1">
                <small>ID: {reporte._id?.slice(-8) || 'N/A'}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Estado del Reporte</small>
              </div>
              <div className="mt-2">
                <Badge 
                  bg={
                    reporte.estado === 'Cerrado' ? 'success' :
                    reporte.estado === 'Procesado' ? 'info' :
                    reporte.estado === 'Cancelado' ? 'danger' :
                    'warning'
                  }
                  className="fs-4 py-2 px-3"
                  style={{ minWidth: '120px' }}
                >
                  {reporte.estado}
                </Badge>
              </div>
              {reporte.fechaProcesado && (
                <div className="text-muted mt-2">
                  <small>
                    Procesado: {new Date(reporte.fechaProcesado).toLocaleDateString('es-ES')}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card 
            className="h-100 border-0 shadow-sm"
            style={{
              backgroundColor: 
                reporte.estadoOperativo === 'Operativo' ? '#d4edda' :
                reporte.estadoOperativo === 'En Mantenimiento' ? '#fff3cd' :
                reporte.estadoOperativo === 'Fuera de Servicio' ? '#f8d7da' :
                reporte.estadoOperativo === 'Dado de Baja' ? '#e2e3e5' :
                '#f8f9fa'
            }}
          >
            <Card.Body className="text-center">
              <div className="text-muted mb-2">
                <small className="text-uppercase fw-semibold">Estado Operativo</small>
              </div>
              <div className="fs-4 fw-bold mt-2" style={{ 
                color: 
                  reporte.estadoOperativo === 'Operativo' ? '#155724' :
                  reporte.estadoOperativo === 'En Mantenimiento' ? '#856404' :
                  reporte.estadoOperativo === 'Fuera de Servicio' ? '#721c24' :
                  reporte.estadoOperativo === 'Dado de Baja' ? '#383d41' :
                  '#495057'
              }}>
                {reporte.estadoOperativo === 'Operativo' && '✅'}
                {reporte.estadoOperativo === 'En Mantenimiento' && '🔧'}
                {reporte.estadoOperativo === 'Fuera de Servicio' && '⚠️'}
                {reporte.estadoOperativo === 'Dado de Baja' && '🔴'}
                {!reporte.estadoOperativo && '❓'}
                <div className="mt-1">
                  {reporte.estadoOperativo || 'No especificado'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Responsable y actividades */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">📋 Información General</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
    
                <div className="mb-3">
                  <strong>Responsable:</strong>{' '} {reporte.ResponsableMtto?.firstName || ''} {reporte.ResponsableMtto?.lastName || ''}

                </div>
                <div className="mb-3">
                  <strong>Cargo:</strong> {' '} {reporte.ResponsableMtto?.role || ''}
                </div>
            </Col>
            <Col md={6}>
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
      {/* Información del Cliente */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">🏢 Información del Cliente</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="mb-2"><strong>Cliente:</strong> {reporte.ClienteId?.Razonsocial || 'N/A'}</div>
              <div className="mb-2"><strong>Nit:</strong> {reporte.ClienteId?.Nit || 'N/A'}</div>
              <div className="mb-2"><strong>Ciudad:</strong> {reporte.ClienteId?.Ciudad || ''} - {reporte.ClienteId?.Direccion || ''}</div>
            </Col>
            <Col md={6}>
              <div className="mb-2"><strong>Sede:</strong> {reporte.equipoSnapshot?.Sede || 'N/A'}</div>
              <div className="mb-2"><strong>Contacto:</strong> {reporte.ClienteId?.UserContacto || 'N/A'}</div>
              <div className="mb-2"><strong>Teléfono:</strong> {reporte.ClienteId?.TelContacto || 'N/A'}</div>
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
              <div className="mb-2"><strong>Inventario:</strong> {reporte.equipoSnapshot?.Inventario || 'N/A'}</div>
              <div className="mb-2"><strong>Ubicación:</strong>  {reporte.equipoSnapshot?.Servicio || 'N/A'} -{reporte.equipoSnapshot?.Ubicacion || 'N/A'}</div>
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

      {/* Repuestos pendientes */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            ⏳ Repuestos Pendientes ({repuestosPendientes.length})
          </h5>
        </Card.Header>
        <Card.Body>
          {repuestosPendientes.length > 0 ? (
            <ListGroup>
              {repuestosPendientes.map((repuesto) => (
                <ListGroup.Item key={repuesto._id} role="button" onClick={() => navigate('/repuestos/solicitados')}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-bold">{repuesto.nombre}</div>
                      <small className="text-muted d-block mt-1">
                        Cantidad: {repuesto.Cantidad} • Prioridad: {repuesto.Prioridad || 'N/A'}
                      </small>
                      <small className="text-muted d-block mt-1">
                        Solicitado por: {[repuesto?.ResponsableSolicitud?.firstName, repuesto?.ResponsableSolicitud?.lastName].filter(Boolean).join(' ') || 'N/A'}
                        {' '}• Fecha: {repuesto.FechaSolicitud ? new Date(repuesto.FechaSolicitud).toLocaleDateString('es-ES') : 'N/A'}
                      </small>
                    </div>
                    <Badge bg="warning" text="dark">En Proceso</Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info" className="mb-0">
              No pending spare parts
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Repuestos */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark">
          <h5 className="mb-0">
            🔧 Repuestos Utilizados ({repuestosInstalados.length})
          </h5>
        </Card.Header>
        <Card.Body>
          {repuestosInstalados.length > 0 ? (
            <ListGroup>
              {repuestosInstalados.map((repuesto) => (
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
                    <Badge bg={repuesto.EstadoSolicitud === 'Instalado' ? 'success' : 'secondary'}>
                      {repuesto.EstadoSolicitud}
                    </Badge>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <Alert variant="info" className="mb-0">
              No spare parts were installed for this report
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
                <Col md={4} key={evidencia._id || index} className="mb-3">
                  <Card className="shadow-sm">
                    <Card.Img
                      variant="top"
                      src={evidencia.url}
                      style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setGalleryStartIndex(index)}
                      loading="lazy"
                      alt={evidencia.descripcion || evidencia.nombre}
                    />
                    <Card.Body className="p-2">
                      {evidencia.descripcion ? (
                        <small
                          className="text-dark d-block text-truncate"
                          title={evidencia.descripcion}
                        >
                          {evidencia.descripcion}
                        </small>
                      ) : (
                        <small className="text-muted fst-italic d-block">Sin descripción</small>
                      )}
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

      <ImageGalleryModal
        show={galleryStartIndex !== null}
        images={(reporte.evidencias ?? []).map((e) => ({
          url: e.url,
          nombre: e.nombre,
          descripcion: e.descripcion,
        }))}
        startIndex={galleryStartIndex ?? 0}
        onClose={() => setGalleryStartIndex(null)}
        title="Evidencias"
      />
    </Container>
  );
};

export default ViewReportPage;
