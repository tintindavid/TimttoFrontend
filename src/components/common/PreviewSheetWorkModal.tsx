import React from 'react';
import { Modal, Button, Badge, Row, Col, Table, Alert, Spinner } from 'react-bootstrap';
import { FaFilePdf, FaPrint } from 'react-icons/fa';
import { SheetWork } from '@/types/reporte.types';

interface TenantData {
  name: string;
  nit: string;
  logoUrl?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
}

interface PreviewSheetWorkModalProps {
  show: boolean;
  onHide: () => void;
  sheetWork: SheetWork | null;
  tenantData?: TenantData | null;
  onDownloadPdf?: () => void;
}

/**
 * Componente reutilizable para vista previa de Hoja de Trabajo
 * Usado en WorkSheets.tsx y HojasTrabajoTab.tsx
 */
const PreviewSheetWorkModal: React.FC<PreviewSheetWorkModalProps> = ({
  show,
  onHide,
  sheetWork,
  tenantData,
  onDownloadPdf,
}) => {

  console.log('Mostrando PreviewSheetWorkModal para sheetWork:', sheetWork);
  console.log('Con tenantData:', tenantData);

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadClick = async () => {
    if (onDownloadPdf) {
      setIsDownloading(true);
      try {
        await onDownloadPdf();
      } catch (error) {
        console.error('Error al descargar PDF:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Borrador':
        return 'warning';
      case 'Firmada':
        return 'success';
      case 'Cerrada':
        return 'secondary';
      default:
        return 'info';
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFilePdf className="me-2 text-danger" />
          Vista Previa - Hoja de Trabajo
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
        {/* Overlay de carga durante descarga de PDF */}
        {isDownloading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Generando PDF...</span>
            </Spinner>
            <div className="mt-3 text-primary fw-bold">Generando PDF...</div>
            <small className="text-muted">Por favor espera un momento</small>
          </div>
        )}

        {!sheetWork ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <div className="mt-2 text-muted">Cargando detalles de la hoja de trabajo...</div>
          </div>
        ) : (
          <div
            className="bg-white shadow-sm p-4"
            style={{
              maxHeight: '70vh',
              overflowY: 'auto',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Encabezado estilo PDF */}
            <div className="text-center mb-4 pb-3 border-bottom border-2">
              <h3 className="mb-2 text-primary fw-bold">HOJA DE TRABAJO</h3>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <strong>Número:</strong> {sheetWork.numeroHoja}
                </div>
                <div>
                  <strong>Fecha:</strong>{' '}
                  {sheetWork.createdAt ? (
                    new Date(sheetWork.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  ) : (
                    'N/A'
                  )}
                </div>
                <div>
                  <Badge bg={getEstadoColor(sheetWork.estado)} className="fs-6">
                    {sheetWork.estado}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            {(sheetWork as any).clienteId && (
              <div className="mb-4 p-3 bg-light rounded">
                <h5 className="mb-3 text-secondary">🏢 Información del Cliente</h5>
                <Row 
                  style={{fontSize:14}}
                >
                  <Col md={6}>
                    <div className="mb-2">
                      <strong>Razón Social:</strong>{' '}
                      {(sheetWork as any).clienteId.Razonsocial || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>NIT:</strong> {(sheetWork as any).clienteId.Nit || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Dirección:</strong> {(sheetWork as any).clienteId.Direccion || 'N/A'}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-2">
                      <strong>Ciudad:</strong> {(sheetWork as any).clienteId.Ciudad || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Departamento:</strong>{' '}
                      {(sheetWork as any).clienteId.Departamento || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Teléfono:</strong>{' '}
                      {(sheetWork as any).clienteId.TelContacto || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong> {(sheetWork as any).clienteId.Email || 'N/A'}
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Listado de Equipos */}
            <div className="mb-4">
              <h5 className="mb-3 text-secondary border-bottom pb-2">
                📋 Equipos Procesados ({sheetWork.reports?.length || 0})
              </h5>

              {sheetWork.reports && sheetWork.reports.length > 0 ? (
                <div className="table-responsive">
                  <Table bordered hover size="sm"
                    style={{fontSize:14}}
                  >
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '5%' }}>#</th>
                        <th style={{ width: '7%' }}>Reporte</th>
                        <th style={{ width: '20%' }}>Equipo</th>
                        <th style={{ width: '13%' }}>Marca</th>
                        <th style={{ width: '9%' }}>Modelo</th>
                        <th style={{ width: '9%' }}>Serie</th>
                        <th style={{ width: '8%' }}>Inventario</th>
                        <th style={{ width: '8%' }}>Sede</th>
                        <th style={{ width: '13%' }}>Ubicación</th>
                        <th style={{ width: '8%' }}>Tipo Mtto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetWork.reports.map((equipo, index) => {
                        const equipoId = equipo._id;
                        return (
                          <tr key={equipoId}>
                            <td className="text-center fw-bold">{index + 1}</td>
                            <td>{equipo.consecutivo || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.ItemText || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.Marca || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.Modelo || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.Serie || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.Inventario || 'N/A'}</td>
                            <td>{equipo?.equipoSnapshot?.Sede || 'N/A'}</td>
                            <td>
                              {equipo?.equipoSnapshot?.Servicio || 'N/A'}
                              <small> {equipo?.equipoSnapshot?.Ubicacion || ''}</small>
                            </td>
                            <td>{equipo.tipoMtto || 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="warning" className="mb-0">
                  No hay equipos asociados a esta hoja de trabajo
                </Alert>
              )}
            </div>

            {/* Firmas */}
            {((sheetWork as any).firmaFile || (sheetWork as any).firmaResponsableFile) && (
              <div className="mt-3 pt-2 border-top">
                <h6 className="mb-2 text-secondary" style={{ fontSize: 14 }}>✍️ Firmas</h6>
                <Row className="g-2">
                  {/* Firma del Responsable del Servicio */}
                  {(sheetWork as any).firmaResponsableFile && (
                    <Col md={6}>
                      <div className="text-center p-2 bg-light rounded" style={{ fontSize: 12 }}>
                        <div className="fw-bold mb-1" style={{ fontSize: 11, color: '#28a745' }}>
                          Responsable del Servicio
                        </div>
                        <img
                          src={(sheetWork as any).firmaResponsableFile}
                          alt="Firma del responsable"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '80px',
                            border: '1px solid #dee2e6',
                            borderRadius: '3px',
                            backgroundColor: 'white',
                          }}
                        />
                        <div className="mt-1">
                          <div style={{ fontSize: 11 }}>
                            <strong>{(sheetWork as any).fullNameResponsable || 'N/A'}</strong>
                          </div>
                          <small className="text-muted" style={{ fontSize: 10 }}>
                            {(sheetWork as any).cargoResponsable || 'Técnico de Servicio'}
                          </small>
                        </div>
                      </div>
                    </Col>
                  )}

                  {/* Firma del que Recibe */}
                  {(sheetWork as any).firmaFile && (
                    <Col md={6}>
                      <div className="text-center p-2 bg-light rounded" style={{ fontSize: 12 }}>
                        <div className="fw-bold mb-1" style={{ fontSize: 11, color: '#007bff' }}>
                          Recibe
                        </div>
                        <img
                          src={(sheetWork as any).firmaFile}
                          alt="Firma del que recibe"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '80px',
                            border: '1px solid #dee2e6',
                            borderRadius: '3px',
                            backgroundColor: 'white',
                          }}
                        />
                        <div className="mt-1">
                          <div style={{ fontSize: 11 }}>
                            <strong>{(sheetWork as any).personaRecibe || 'N/A'}</strong>
                          </div>
                          <small className="text-muted" style={{ fontSize: 10 }}>
                            {(sheetWork as any).cargoRecibe || 'N/A'}
                          </small>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}

            {/* Firma del Cliente (si está firmada) */}
            {sheetWork.estado === 'Firmada' && (sheetWork as any).firmaCliente && (
              <div className="mt-2 pt-2 border-top">
                <h6 className="mb-2 text-secondary" style={{ fontSize: 13 }}>✍️ Firma del Cliente</h6>
                <div className="text-center p-2 bg-light rounded">
                  <div className="fw-bold mb-1" style={{ fontSize: 12 }}>
                    {(sheetWork as any).firmaCliente}
                  </div>
                  <small className="text-muted" style={{ fontSize: 11 }}>
                    Firmado el:{' '}
                    {(sheetWork as any).fechaFirma && !isNaN(new Date((sheetWork as any).fechaFirma).getTime())
                      ? new Date((sheetWork as any).fechaFirma).toLocaleDateString('es-ES')
                      : 'N/A'}
                  </small>
                </div>
              </div>
            )}

            {/* Pie de página */}
            <div className="mt-4 pt-3 border-top text-center text-muted">
              <small>
                Documento generado el {new Date().toLocaleDateString('es-ES')} a las{' '}
                {new Date().toLocaleTimeString('es-ES')}
              </small>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDownloading}>
          Cerrar
        </Button>
        {onDownloadPdf && (
          <Button 
            variant="primary" 
            onClick={handleDownloadClick}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
                Generando...
              </>
            ) : (
              <>
                <FaPrint className="me-1" />
                Descargar PDF
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default PreviewSheetWorkModal;
