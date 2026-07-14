import React, { useState, useMemo, useCallback, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Tab, Alert, Button, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
import OtNotasModal from '../components/ots/OtNotasModal';
import HistoryTimelineModal from '../components/ots/HistoryTimelineModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

// Hooks and Services
import { useOT } from '../hooks/useOTs';
import { useReportes } from '../hooks/useReportes';
import { reporteService } from '../services/reporte.service';
import { otService } from '../services/ot.service';
import { exportOtToXlsx } from '../services/otExport.service';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// Types
import { Reporte, ActividadRealizada, RepuestoReporte } from '../types/reporte.types';
import { OT } from '../types/ot.types';

const OtDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAddEquipoModal, setShowAddEquipoModal] = useState(false);
  const [isUpdatingReporte, setIsUpdatingReporte] = useState(false);
  // When the "Cerrar HT" quick action is used, we pass this flag to <WorkSheets>
  // so it opens the Create modal immediately; WorkSheets clears it via
  // onAutoOpenHandled once consumed so it doesn't re-fire on every render.
  const [autoOpenCreateSheet, setAutoOpenCreateSheet] = useState(false);
  const [showNotasModal, setShowNotasModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Queries
  const { data: otResponse, isLoading: loadingOT, error: otError, refetch: refetchOt } = useOT(id!);
  

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

  //reportes reportesProcesados sin hojaDeTrabajo 
  const reportesSinHoja = useMemo(() =>
    reportesProcesados.filter((r: Reporte) => !r.hojaDeTrabajo && (r.estado==='Procesado'||r.estado==='Cancelado')),
    [reportesProcesados]
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
    // Activar spinner
    setIsUpdatingReporte(true);
    
    try {
      await reporteService.updateReporte(reporteId, updates);
      await refetchReportes();
      
      // Update selected reporte if it's the one being updated
      if (selectedReporte?._id === reporteId) {
        setSelectedReporte(prev => prev ? { ...prev, ...updates } : null);
      }
      
      // Mostrar alerta de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Reporte Actualizado!',
        text: 'El reporte se ha guardado exitosamente.',
        confirmButtonColor: '#28a745',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error updating reporte:', error);
      
      // Mostrar alerta de error
      await Swal.fire({
        icon: 'error',
        title: 'Error al Actualizar',
        text: 'No se pudo actualizar el reporte. Inténtelo de nuevo.',
        confirmButtonColor: '#d33'
      });
      
      throw error;
    } finally {
      // Desactivar spinner
      setIsUpdatingReporte(false);
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

  // Función para refrescar datos y actualizar el reporte seleccionado
  const handleRefreshData = useCallback(async () => {
    try {
      // Refrescar datos desde el backend
      const result = await refetchReportes();
      
      // Si hay un reporte seleccionado, actualizarlo con los datos frescos
      if (selectedReporte && result.data?.data) {
        const reporteActualizado = result.data.data.find((r: Reporte) => r._id === selectedReporte._id);
        if (reporteActualizado) {
          console.log('Actualizando reporte seleccionado con datos frescos:', reporteActualizado);
          setSelectedReporte(reporteActualizado);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [refetchReportes, selectedReporte]);

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
      // Refresh reports first — the backend recomputes OT progress when a sheet
      // is signed, so the OT snapshot below reflects the just-updated state.
      await refetchReportes();
      const refreshed = await refetchOt();
      const updatedOt = (refreshed?.data as { data?: OT } | undefined)?.data;

      // Auto-complete when every report attached to this OT is closed and the
      // backend already flagged EstadoOt as 'Cerrado'. PATCH to 'Completado'
      // reuses the existing service transaction (which consumes spare parts,
      // decrements inventory, etc.) so we don't duplicate that logic here.
      if (updatedOt?.EstadoOt === 'Cerrado' && id) {
        try {
          await otService.patch(id, { EstadoOt: 'Completado' } as never);
          await refetchOt();
          toast.success('OT completada automáticamente — todas las hojas fueron firmadas.');
        } catch (completeErr) {
          console.error('Error auto-completando OT:', completeErr);
          toast.warn('La hoja se firmó pero no fue posible completar la OT automáticamente. Revisa los repuestos e intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error signing worksheet:', error);
      throw error;
    }
  }, [id, refetchReportes, refetchOt]);

  // Manual completion fallback. Normally the OT auto-completes when the last
  // worksheet is signed (handleSignWorkSheet). This handler only runs from the
  // safety-net button that appears when EstadoOt got stuck in 'Cerrado'.
  const handleCompleteOT = useCallback(async () => {
    if (!id) return;
    try {
      await otService.patch(id, { EstadoOt: 'Completado' } as never);
      await refetchOt();
      setShowCompleteModal(false);
      toast.success('OT completada.');
    } catch (error) {
      console.error('Error completing OT:', error);
      toast.error('No fue posible completar la OT.');
    }
  }, [id, refetchOt]);


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
    <Container fluid className="mt-4" style={{ position: 'relative' }}>
      {/* Overlay de spinner cuando está actualizando */}
      {isUpdatingReporte && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Actualizando...</span>
          </div>
          <div className="text-light mt-3 fs-5">
            Guardando reporte, por favor espere...
          </div>
        </div>
      )}
      
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
            onRefreshData={handleRefreshData}
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
              {(ot as unknown as { isFromTicket?: boolean })?.isFromTicket && (
                <span
                  className="badge bg-info text-dark ms-2"
                  style={{ fontSize: '0.6em', verticalAlign: 'middle' }}
                  title="Esta OT fue generada desde tickets y tiene acciones bloqueadas (Agregar Equipo, cambiar TipoServicio, eliminar Reports)."
                >
                  OT desde Ticket
                </span>
              )}
            </h1>
            {/*
              Manual "Completar OT" button removed — OT auto-completes in
              handleSignWorkSheet as soon as the backend flags EstadoOt as 'Cerrado'
              (all reports closed). Preserved as a safety-net for the edge case
              where the OT ended up Cerrado but the auto-complete PATCH failed.
            */}
            {porcentajeProcesados === 100 && reportes.length > 0 && ot?.EstadoOt === 'Cerrado' && (
              <Button
                variant="success"
                onClick={() => setShowCompleteModal(true)}
                className="ms-2"
                title="La OT quedó en estado Cerrado pero no se completó automáticamente. Vuelve a intentar."
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
            <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-2">
              <h6 className="mb-0 text-muted">
                <FaTools className="me-2" />
                Acciones Rápidas
              </h6>

              {/* flex-wrap so the buttons stack across rows on narrow viewports
                  instead of overflowing the card. ButtonGroup would force a
                  single row and clip on mobile. */}
              <div className="d-flex flex-wrap gap-1 justify-content-start justify-content-md-end">

                {/* When there are processed reports without an assigned
                    worksheet, the primary action is closing them (create a new
                    HT). Otherwise the button just navigates to the tab. */}
                {reportesSinHoja.length > 0 ? (
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(
                      `Cerrar hoja de trabajo con ${reportesSinHoja.length} reporte${reportesSinHoja.length === 1 ? '' : 's'} procesado${reportesSinHoja.length === 1 ? '' : 's'}`,
                      'tooltip-cerrar-ht',
                    )}
                  >
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => {
                        setActiveTab('worksheets');
                        setAutoOpenCreateSheet(true);
                      }}
                    >
                      <FaClipboardList className="me-1" />
                      Cerrar HT ({reportesSinHoja.length})
                    </Button>
                  </OverlayTrigger>
                ) : (
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip('Ver Hojas de Trabajo', 'tooltip-worksheets')}
                  >
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setActiveTab('worksheets')}
                    >
                      <FaClipboardList className="me-1" />
                      Hojas de Trabajo
                    </Button>
                  </OverlayTrigger>
                )}

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Ver Solicitudes de Repuestos', 'tooltip-repuestos')}
                >
                  <Button size="sm" variant="outline-info" onClick={() => setActiveTab('repuestos')}>
                    <FaCog className="me-1" />
                    Repuestos
                  </Button>
                </OverlayTrigger>

                {/* D18/D19: Hide "Agregar Equipo" when the OT was created from tickets.
                    Adding equipos to a ticket-sourced OT is blocked at the backend
                    with 409 OT_LOCKED_FROM_TICKET. */}
                {!(ot as unknown as { isFromTicket?: boolean })?.isFromTicket && (
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip('Agregar Equipo a la OT', 'tooltip-agregar')}
                  >
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => setShowAddEquipoModal(true)}
                    >
                      <FaPlus className="me-1" />
                      Agregar Equipo
                    </Button>
                  </OverlayTrigger>
                )}

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Ver Historial de Cambios', 'tooltip-historial')}
                >
                  <Button size="sm" variant="outline-secondary" onClick={() => setShowHistoryModal(true)}>
                    <FaHistory className="me-1" />
                    Historial
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Comentarios y Notas', 'tooltip-notas')}
                >
                  <Button size="sm" variant="outline-dark" onClick={() => setShowNotasModal(true)}>
                    <FaComments className="me-1" />
                    Notas
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Exportar OT a Excel (Reportes + Repuestos)', 'tooltip-exportar')}
                >
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      if (!ot) return;
                      try {
                        exportOtToXlsx(ot, reportes);
                        toast.success('Exportación descargada.');
                      } catch (err) {
                        console.error('Export error:', err);
                        toast.error('No fue posible exportar la OT.');
                      }
                    }}
                    disabled={!ot || reportes.length === 0}
                  >
                    <FaFileExport className="me-1" />
                    Exportar
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={renderTooltip('Imprimir OT', 'tooltip-imprimir')}
                >
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => window.print()}
                  >
                    <FaPrint />
                  </Button>
                </OverlayTrigger>

              </div>
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
                  📋 Listado Total
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reports">
                  ⌛ Reportes Pendientes 
                  {reportesPendientes.length > 0 && (
                    <span className="badge bg-warning ms-1">
                      {reportesPendientes.length}
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
                    <ReportsList 
                      reportes={reportes}
                      onReporteSelect={handleReporteSelect}
                    />
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
                  reportesProcesados={reportesSinHoja}
                  onCreateSheet={handleCreateWorkSheet}
                  onSignSheet={handleSignWorkSheet}
                  clienteId={ot.ClienteId?._id!}
                  autoOpenCreate={autoOpenCreateSheet}
                  onAutoOpenHandled={() => setAutoOpenCreateSheet(false)}
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

      {/* Notas Modal */}
      {id && (
        <OtNotasModal
          show={showNotasModal}
          onHide={() => setShowNotasModal(false)}
          otId={id}
        />
      )}

      {/* History Timeline Modal */}
      {id && (
        <HistoryTimelineModal
          show={showHistoryModal}
          onHide={() => setShowHistoryModal(false)}
          resourceType="OT"
          resourceId={id}
          title={`Historial · OT ${ot?.Consecutivo || ''}`}
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