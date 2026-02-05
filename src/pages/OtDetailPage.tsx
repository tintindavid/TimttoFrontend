import React, { useState, useMemo, useCallback, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Tab, Alert, Button, Modal, ButtonGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClipboardList, 
  FaCog, 
  FaFileExport, 
  FaPrint, 
  FaHistory, 
  FaPlus, 
  FaFileAlt, 
  FaComments,
  FaTools
} from 'react-icons/fa';

// Components
import OtHeader from '../components/ots/OtHeader';
import ReportsList from '../components/ots/ReportsList';
import ReportDetail from '../components/ots/ReportDetail';
import WorkSheets from '../components/ots/WorkSheets';
import AddEquipoToOtModal from '../components/ots/AddEquipoToOtModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

// Hooks and Services
import { useOT } from '../hooks/useOTs';
import { useReportes } from '../hooks/useReportes';
import { reporteService } from '../services/reporte.service';

// Types
import { Reporte, ActividadRealizada, Evidencia, RepuestoReporte } from '../types/reporte.types';
import { OT } from '../types/ot.types';

const OtDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAddEquipoModal, setShowAddEquipoModal] = useState(false);

  // Queries
  const { data: otResponse, isLoading: loadingOT, error: otError } = useOT(id!);
  

  const { 
    data: reportesResponse, 
    isLoading: loadingReportes, 
    error: reportesError ,
    refetch: refetchReportes 
  } = useReportes({ otId: id });

  // Extract data from API response
  const ot = otResponse?.data as OT | undefined;
  const reportes = reportesResponse?.data || [];

  // Computed Values
  const reportesProcesados = useMemo(() => 
    reportes.filter((r: Reporte) => r.estado==='Procesado' || r.estado==='Cerrado' || r.estado==='Cancelado'), 
    [reportes]
  );

  const reportesPendientes = useMemo(() => 
    reportes.filter((r: Reporte) => !r.fechaFinalizdo ), // si no existe fechaFinalizdo
    [reportes]
  );

  const reportesCerrados = useMemo(() => 
    reportes.filter((r: Reporte) => r.fechaFinalizdo),  // si existe fechaFinalizdo
    [reportes]
  );

  const porcentajeProcesados = useMemo(() => 
    reportes.length > 0 ? Math.round((reportesProcesados.length / reportes.length) * 100) : 0,
    [reportesProcesados.length, reportes.length]
  );

  // Event Handlers
  const handleReporteSelect = useCallback((reporte: Reporte) => {
    setSelectedReporte(reporte);
    setActiveTab('reporte-detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedReporte(null);
    setActiveTab('overview');
  }, []);

  const handleUpdateReporte = useCallback(async (
    reporteId: string,
    updates: Partial<Reporte>
  ) => {
    try {
      await reporteService.updateReporte(reporteId, updates);
      await refetchReportes();
      
      // Update selected reporte if it's the one being updated
      if (selectedReporte?._id === reporteId) {
        setSelectedReporte(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating reporte:', error);
      throw error;
    }
  }, [refetchReportes, selectedReporte]);

  const handleAddActividad = useCallback(async (
    reporteId: string,
    actividad: Omit<ActividadRealizada, '_id' | 'fecha'>
  ) => {
    try {
      await reporteService.addActividad(reporteId, actividad);
      await refetchReportes();
    } catch (error) {
      console.error('Error adding actividad:', error);
      throw error;
    }
  }, [refetchReportes]);

  const handleAddEvidencia = useCallback(async (
    reporteId: string,
    evidencia: Omit<Evidencia, '_id' | 'fechaSubida'>
  ) => {
    try {
      await reporteService.addEvidencia(reporteId, evidencia);
      await refetchReportes();
    } catch (error) {
      console.error('Error adding evidencia:', error);
      throw error;
    }
  }, [refetchReportes]);

  const handleAddRepuesto = useCallback(async (
    reporteId: string,
    repuesto: Omit<RepuestoReporte, '_id'>
  ) => {
    try {
      await reporteService.addRepuesto(reporteId, repuesto);
      await refetchReportes();
    } catch (error) {
      console.error('Error adding repuesto:', error);
      throw error;
    }
  }, [refetchReportes]);

  const handleMarkAsProcessed = useCallback(async (reporte: Reporte) => {
    try {
      await reporteService.markAsProcessed(reporte._id!, reporte);
      await refetchReportes();
      
      // Show completion modal if all equipments are processed
      const updatedReportes = reportes.map((r: Reporte) => 
        r._id === reporte._id ? { ...r, procesado: true } : r
      );
      const allProcessed = updatedReportes.every((r: Reporte) => r.procesado);
      if (allProcessed) {
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.error('Error marking as processed:', error);
      throw error;
    }
  }, [refetchReportes, reportes]);

  const handleCreateWorkSheet = useCallback(async (
    equiposIds: string[], 
    datosRecepcion?: { recibe: string; cargo: string; firma: string; responsable: string; cargoResponsable?: string; fullName?: string; firmaResponsableFile?: string; clientId?: string }
  ) => {
    try {
      await reporteService.createWorkSheet(id!, equiposIds, datosRecepcion);
      await refetchReportes();
    } catch (error) {
      console.error('Error creating worksheet:', error);
      throw error;
    }
  }, [id, refetchReportes]);

  const handleSignWorkSheet = useCallback(async (sheetId: string, firma: string) => {
    try {
      await reporteService.signWorkSheet(sheetId, firma);
      await refetchReportes();
    } catch (error) {
      console.error('Error signing worksheet:', error);
      throw error;
    }
  }, [refetchReportes]);

  const handleCompleteOT = useCallback(async () => {
    try {
      // TODO: Implement OT completion logic
      console.log('Completing OT:', id);
      setShowCompleteModal(false);
      navigate('/ots');
    } catch (error) {
      console.error('Error completing OT:', error);
    }
  }, [id, navigate]);


  const renderTooltip = (
  text: string,
  id: string
): ReactElement => {
  return (
    <Tooltip id={id}>
      {text}
    </Tooltip>
  );
};


  // Loading and Error States
  if (loadingOT || loadingReportes) {
    return (
      <Container className="mt-4">
        <LoadingSpinner message="Cargando orden de trabajo..." />
      </Container>
    );
  }

  if (otError) {
    return (
      <Container className="mt-4">
        <ErrorAlert 
          title="Error cargando OT" 
          message="No se pudo cargar la información de la orden de trabajo" 
        />
        <Button 
          variant="outline-primary" 
          onClick={() => navigate('/ots')}
          className="mt-3"
        >
          <FaArrowLeft className="me-2" />
          Volver a OTs
        </Button>
      </Container>
    );
  }

  if (!ot) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Orden de trabajo no encontrada
        </Alert>
        <Button 
          variant="outline-primary" 
          onClick={() => navigate('/ots')}
        >
          <FaArrowLeft className="me-2" />
          Volver a OTs
        </Button>
      </Container>
    );
  }

  // At this point, ot is guaranteed to exist
  if (!ot) {
    return <div>Error: OT data not found</div>;
  }

  return (
    <Container fluid className="mt-4">
      {/* Report Detail Tab */}
      {selectedReporte? (
        <>
          <div className="mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleBackToList}
            >
              <FaArrowLeft className="me-1" />
              Volver a la Lista
            </Button>
          </div>
          <ReportDetail 
            reporte={selectedReporte}
            onBack={handleBackToList}
            onSave={(reporte) => handleUpdateReporte(reporte._id!, reporte)}
            onMarkAsProcessed={handleMarkAsProcessed}
            onRefreshData={() => refetchReportes()}
          />
        </>
      ) :
      <>
      <Row className="mb-4">
        <Col>
          {/* Navigation Header */}
          <div className="d-flex align-items-center mb-3">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => navigate('/ots')}
              className="me-3"
            >
              <FaArrowLeft className="me-1" />
              Volver 
            </Button>
            <h1 className="h3 mb-0 flex-grow-1">
              Detalle OT - {ot.numeroOT || ot.Consecutivo}
            </h1>
            {porcentajeProcesados === 100 && reportes.length > 0 && (
              <Button 
                variant="success"
                onClick={() => setShowCompleteModal(true)}
                className="ms-2"
              >
                <FaCheckCircle className="me-1" />
                Completar OT
              </Button>
            )}
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
        {/* Action Bar */}
          <div className="bg-light border rounded p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-muted">
                <FaTools className="me-2" />
                Acciones Rápidas
              </h6>

              <ButtonGroup size="sm">

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Ver Hojas de Trabajo', 'tooltip-worksheets')}
                >
                  <Button
                    variant="outline-primary"
                    onClick={() => setActiveTab('worksheets')}
                  >
                    <FaClipboardList className="me-1" />
                    Hojas de Trabajo
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Ver Solicitudes de Repuestos', 'tooltip-repuestos')}
                >
                  <Button variant="outline-info"
                    onClick={()=>setActiveTab('repuestos')}>
                    <FaCog className="me-1" />
                    Repuestos
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Agregar Equipo a la OT', 'tooltip-agregar')}
                >
                  <Button 
                    variant="outline-success"
                    onClick={() => setShowAddEquipoModal(true)}
                  >
                    <FaPlus className="me-1" />
                    Agregar Equipo
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Ver Historial de Cambios', 'tooltip-historial')}
                >
                  <Button variant="outline-secondary">
                    <FaHistory className="me-1" />
                    Historial
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Documentos y Archivos', 'tooltip-documentos')}
                >
                  <Button variant="outline-warning">
                    <FaFileAlt className="me-1" />
                    Documentos
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Comentarios y Notas', 'tooltip-notas')}
                >
                  <Button variant="outline-dark">
                    <FaComments className="me-1" />
                    Notas
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Exportar / Imprimir OT', 'tooltip-exportar')}
                >
                  <Button variant="outline-primary">
                    <FaFileExport className="me-1" />
                    Exportar
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Imprimir OT', 'tooltip-imprimir')}
                >
                  <Button
                    variant="outline-secondary"
                    onClick={() => window.print()}
                  >
                    <FaPrint />
                  </Button>
                </OverlayTrigger>

              </ButtonGroup>
            </div>
          </div>


          <OtHeader 
            ot={ot}
            totalEquipos={reportes?.length}
            equiposProcesados={reportesProcesados?.length}
          />
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          {/* Main Content Tabs */}
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="overview">
                  📋 Vista General
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reports">
                  ⌛ Reportes 
                  {reportesPendientes.length > 0 && (
                    <span className="badge bg-warning ms-1">
                      {reportesPendientes.length} Pendientes
                    </span>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reports-closed">
                  ✅ Reportes Cerrados ({reportesCerrados.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="worksheets">
                  📄 Hojas de Trabajo
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="repuestos">
                  🔩 Repuesto Ot 
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Overview Tab */}
              <Tab.Pane eventKey="overview">
                <Row>
                  <Col lg={8}>
                    <ReportsList 
                      reportes={reportes}
                      onReporteSelect={handleReporteSelect}
                    />
                  </Col>
                  <Col lg={4}>
                    <div className="mb-4">
                      <h5>📊 Resumen de Progreso</h5>
                      <div className="bg-light p-3 rounded">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Equipos Totales:</span>
                          <strong>{reportes.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Procesados:</span>
                          <strong className="text-success">{reportesProcesados.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Pendientes:</span>
                          <strong className="text-warning">{reportesPendientes.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Progreso:</span>
                          <strong>{porcentajeProcesados}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h5>⚡ Acciones Rápidas</h5>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="outline-primary"
                          onClick={() => setActiveTab('reports')}
                          disabled={reportes.length === 0}
                        >
                          Ver Todos los Reportes
                        </Button>
                        <Button 
                          variant="outline-success"
                          onClick={() => setActiveTab('worksheets')}
                          disabled={reportesProcesados.length === 0}
                        >
                          Gestionar Hojas de Trabajo
                        </Button>
                        {porcentajeProcesados === 100 && reportes.length > 0 && (
                          <Button 
                            variant="success"
                            onClick={() => setShowCompleteModal(true)}
                          >
                            <FaCheckCircle className="me-1" />
                            Completar OT
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Tab.Pane>

              {/* Reports Tab */}
              <Tab.Pane eventKey="reports">
                <ReportsList 
                  reportes={reportesPendientes}
                  onReporteSelect={handleReporteSelect}
                  showFilters={true}
                />
              </Tab.Pane>

              {/* Closed Reports Tab */}
              <Tab.Pane eventKey="reports-closed">
                <ReportsList 
                  reportes={reportesCerrados}
                  onReporteSelect={handleReporteSelect}
                  showFilters={true}
                />
              </Tab.Pane>

              {/* Worksheets Tab */}
              <Tab.Pane eventKey="worksheets">
                <WorkSheets 
                  otId={id!}
                  reportesProcesados={reportesProcesados}
                  onCreateSheet={handleCreateWorkSheet}
                  onSignSheet={handleSignWorkSheet}
                  clienteId={ot.ClienteId?._id!}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
      </>
     }


      {/* Add Equipo Modal */}
      {ot.ClienteId?._id && (
        <AddEquipoToOtModal
          show={showAddEquipoModal}
          onHide={() => setShowAddEquipoModal(false)}
          otId={id!}
          clienteId={ot.ClienteId._id}
          onSuccess={() => {
            refetchReportes();
            setShowAddEquipoModal(false);
          }}
        />
      )}

      {/* Complete OT Modal */}
      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCheckCircle className="text-success me-2" />
            Completar Orden de Trabajo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <FaCheckCircle className="me-2" />
            Todos los equipos han sido procesados correctamente
          </Alert>
          
          <div className="mb-3">
            <strong>OT:</strong> {ot.numeroOT || ot.Consecutivo}<br />
            <strong>Cliente:</strong> {ot.ClienteId?.nombre ?? ''}<br />
            <strong>Equipos Procesados:</strong> {reportesProcesados.length}/{reportes.length}
          </div>

          <Alert variant="warning">
            <FaExclamationTriangle className="me-2" />
            Una vez completada, la OT no podrá modificarse. 
            Asegúrese de haber generado todas las hojas de trabajo necesarias.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleCompleteOT}>
            <FaCheckCircle className="me-1" />
            Completar OT
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OtDetailPage;