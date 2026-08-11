import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Row, Col, InputGroup, Spinner, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { SheetWork } from '@/types/reporte.types';
import { FaFilePdf, FaSignature, FaPlus, FaDownload, FaSearch, FaFilter, FaTimes, FaEye, FaPrint, FaCheckSquare, FaEnvelope } from 'react-icons/fa';
import { useWorkSheets } from '@/hooks/useReportes';
import { useCloseSheetReports } from '@/hooks/useCloseSheetReports';
import { useSignInPlace } from '@/hooks/useSignInPlace';
import { useAuth } from '@/context/AuthContext';
import './WorkSheets.css';
import { useCurrentUserData } from '@/context/userContext';
import { ca } from 'date-fns/locale';
import { generateBulkPDF } from '@/services/descargarPdf.service';
import PreviewSheetWorkModal from '@/components/common/PreviewSheetWorkModal';
import SignatureInput, { SignatureInputHandle } from '@/components/common/SignatureInput';
import InPlaceSignSection, { InPlaceSignSectionHandle } from '@/components/ots/InPlaceSignSection';
import RemoteSignSection from '@/components/ots/RemoteSignSection';
import ResendSignModal from '@/components/ots/ResendSignModal';
import PdfReportsFilenameModal from '@/components/ots/PdfReportsFilenameModal';
import { sheetworkService } from '@/services/sheetwork.service';
import tenantService from '@/services/tenant.service';
import { customerService } from '@/services/customer.service';

interface WorkSheetsProps {
  otId: string;
  reportesProcesados: any[];
  onCreateSheet: (equiposIds: string[], datosRecepcion?: { recibe: string; cargo: string; firma: string; responsable: string ; cargoResponsable?: string; fullName?: string; firmaResponsableFile?: string; clienteId?: string }) => void;
  onSignSheet: (sheetId: string, firma: string) => void;
  clienteId: string;
  /**
   * When true, the "Create sheet" modal opens automatically on mount. Used by
   * the parent's "Cerrar HT" quick action so the user lands ready to sign
   * instead of having to click Create manually.
   */
  autoOpenCreate?: boolean;
  onAutoOpenHandled?: () => void;
}
const WorkSheets: React.FC<WorkSheetsProps> = ({
  otId,
  reportesProcesados,
  onCreateSheet,
  onSignSheet,
  clienteId,
  autoOpenCreate,
  onAutoOpenHandled,
}) => {
  // Obtener usuario en sesión (useCurrentUserData ya maneja el caching con React Query)
  const { token } = useAuth();
  const currentUserData = useCurrentUserData();
  
  // Obtener hojas de trabajo desde el backend
  const { data: hojasTrabajo = [], isLoading, isError, error, refetch } = useWorkSheets(otId);
  const closeReportsMutation = useCloseSheetReports(otId);
  const signInPlaceMutation = useSignInPlace(otId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showSignCreateModal, setShowSignCreateModal] = useState(false);
  const [signCreateActiveTab, setSignCreateActiveTab] = useState<'inplace' | 'remote'>('inplace');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendTarget, setResendTarget] = useState<SheetWork | null>(null);
  const [showFallbackSignModal, setShowFallbackSignModal] = useState(false);
  const [fallbackSignTarget, setFallbackSignTarget] = useState<SheetWork | null>(null);
  const [filenameModalTarget, setFilenameModalTarget] = useState<SheetWork | null>(null);
  const fallbackSignRef = useRef<InPlaceSignSectionHandle>(null);
  const [fallbackCanSubmit, setFallbackCanSubmit] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<SheetWork | null>(null);
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>([]);
  const [firmaCliente, setFirmaCliente] = useState('');
  const [loadingPdfSheets, setLoadingPdfSheets] = useState<Record<string, boolean>>({});
  const [tenantData, setTenantData] = useState<any>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [customerData, setCustomerData] = useState<{ Email?: string; correousados?: string[] } | null>(null);

  // Estados para firma al crear hoja
  const [recibeNombre, setRecibeNombre] = useState('');
  const [recibeCargo, setRecibeCargo] = useState('');
  const createSignatureRef = useRef<SignatureInputHandle>(null);
  const [hasCreateSignature, setHasCreateSignature] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterModelo, setFilterModelo] = useState('');

  // When the parent's "Cerrar HT" quick action activates the tab, jump straight
  // into the Create-sheet modal instead of forcing the user to click Create.
  useEffect(() => {
    if (!autoOpenCreate) return;
    setShowCreateModal(true);
    onAutoOpenHandled?.();
  }, [autoOpenCreate, onAutoOpenHandled]);

  // Obtener tenant data para el PDF
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!currentUserData?.tenantId) return;

      try {
        const response = await tenantService.getById(currentUserData.tenantId);
        setTenantData(response.data || null);
      } catch (error) {
        console.error('Error al obtener tenant data:', error);
      }
    };

    fetchTenantData();
  }, [currentUserData?.tenantId]);

  // Load customer data so the remote-sign tab can prefill email and offer
  // correousados as autocomplete options.
  useEffect(() => {
    if (!clienteId) return;
    let cancelled = false;
    customerService
      .getById(clienteId)
      .then((res: any) => {
        if (cancelled) return;
        const doc = res?.data || res;
        setCustomerData({ Email: doc?.Email, correousados: doc?.correousados || [] });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clienteId]);
  const [filterSerie, setFilterSerie] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterServicio, setFilterServicio] = useState('');

  // Obtener listas únicas para filtros
  const marcas = useMemo(() => {
    const uniqueMarcas = new Set(reportesProcesados?.map(r => r.equipoSnapshot.Marca).filter(Boolean));
    return Array.from(uniqueMarcas).sort();
  }, [reportesProcesados]);

  const modelos = useMemo(() => {
    const uniqueModelos = new Set(reportesProcesados.map(r => r.equipoSnapshot.Modelo).filter(Boolean));
    return Array.from(uniqueModelos).sort();
  }, [reportesProcesados]);

  const sedes = useMemo(() => {
    const uniqueSedes = new Set(reportesProcesados.map(r => r.equipoSnapshot.Sede).filter(Boolean));
    return Array.from(uniqueSedes).sort();
  }, [reportesProcesados]);

  const servicios = useMemo(() => {
    const uniqueServicios = new Set(reportesProcesados.map(r => r.equipoSnapshot.Servicio).filter(Boolean));
    return Array.from(uniqueServicios).sort();
  }, [reportesProcesados]);

  // Equipos filtrados
  const filteredReportes = useMemo(() => {
    return reportesProcesados.filter(reporte => {
      const equipo = reporte.equipoSnapshot;
      
      // Filtro de búsqueda general
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          equipo.ItemText?.toLowerCase().includes(search) ||
          equipo.Marca?.toLowerCase().includes(search) ||
          equipo.Modelo?.toLowerCase().includes(search) ||
          equipo.Serie?.toLowerCase().includes(search) ||
          equipo.Sede?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Filtro por marca
      if (filterMarca && equipo.Marca !== filterMarca) return false;

      // Filtro por modelo
      if (filterModelo && equipo.Modelo !== filterModelo) return false;

      // Filtro por serie
      if (filterSerie && !equipo.Serie?.toLowerCase().includes(filterSerie.toLowerCase())) return false;

      // Filtro por sede
      if (filterSede && equipo.Sede !== filterSede) return false;

      // Filtro por servicio
      if (filterServicio && equipo.Servicio !== filterServicio) return false;

      return true;
    });
  }, [reportesProcesados, searchTerm, filterMarca, filterModelo, filterSerie, filterSede, filterServicio]);
  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterModelo('');
    setFilterSerie('');
    setFilterSede('');
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || filterMarca || filterModelo || filterSerie || filterSede;

  // Select/Deselect All - solo de los visibles, preservando selecciones previas
  const handleToggleAllVisible = () => {
    const visibleIds = filteredReportes.map(r => r._id!);
    
    // Verificar si todos los visibles están seleccionados
    const allVisibleSelected = visibleIds.every(id => selectedEquipos.includes(id));
    
    if (allVisibleSelected) {
      // Deseleccionar solo los visibles
      setSelectedEquipos(selectedEquipos.filter(id => !visibleIds.includes(id)));
    } else {
      // Agregar los visibles que no están seleccionados (preserva los anteriores)
      const newSelections = [...selectedEquipos];
      visibleIds.forEach(id => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      setSelectedEquipos(newSelections);
    }
  };

  // Verificar si todos los visibles están seleccionados
  const allVisibleSelected = useMemo(() => {
    if (filteredReportes.length === 0) return false;
    return filteredReportes.every(r => selectedEquipos.includes(r._id!));
  }, [filteredReportes, selectedEquipos]);
  const handleProceedToSign = () => {
    if (selectedEquipos.length === 0) {
      alert('Debe seleccionar al menos un equipo procesado');
      return;
    }
    // Cerrar modal de selección y abrir modal de firma
    setShowCreateModal(false);
    setShowSignCreateModal(true);
  };

  const handleCreateSignatureChange = () => {
    setHasCreateSignature(!(createSignatureRef.current?.isEmpty() ?? true));
  };

  const handleCreateSheetWithSignature = () => {
    // Validar campos
    if (!recibeNombre.trim()) {
      alert('El campo "Recibe" es obligatorio');
      return;
    }
    if (!recibeCargo.trim()) {
      alert('El campo "Cargo" es obligatorio');
      return;
    }
    if (createSignatureRef.current?.isEmpty()) {
      alert('Debe firmar para crear la hoja de trabajo');
      return;
    }

    // Validar que tengamos datos del usuario
    if (!currentUserData?._id) {
      alert('Error: No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
      console.error('No user data available:', currentUserData);
      return;
    }

    // `onCreateSheet` expects a data URL (matches the previous
    // `SignatureCanvas.toDataURL()` contract); `SignatureInput` returns the
    // bare base64 payload, so re-add the prefix here.
    const pngBase64 = createSignatureRef.current?.getPngBase64();
    const firmaDataUrl = pngBase64 ? `data:image/png;base64,${pngBase64}` : '';

    // Enviar equipos con datos de recepción
    onCreateSheet(selectedEquipos, {
      recibe: recibeNombre,
      cargo: recibeCargo,
      firma: firmaDataUrl,
      responsable: currentUserData._id,
      cargoResponsable: currentUserData?.role || 'N/A',
      fullName: currentUserData?.fullName || 'N/A',
      firmaResponsableFile: currentUserData?.fileFirma || '',
      clienteId: clienteId
    });
    // Recargar hojas de trabajo después de crear
    setTimeout(() => {
      refetch();
    }, 1000);

    // Limpiar y cerrar
    setShowSignCreateModal(false);
    setSelectedEquipos([]);
    setRecibeNombre('');
    setRecibeCargo('');
    createSignatureRef.current?.clear();
    setHasCreateSignature(false);
  };

  const handleSignSheet = () => {
    if (!selectedSheet || !firmaCliente.trim()) {
      alert('Debe ingresar la firma del cliente');
      return;
    }
    onSignSheet(selectedSheet._id!, firmaCliente);
    
    // Recargar hojas de trabajo después de firmar
    setTimeout(() => {
      refetch();
    }, 1000);
    
    setShowSignModal(false);
    setSelectedSheet(null);
    setFirmaCliente('');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Borrador': return 'warning';
      case 'EnviadaAFirmar': return 'info';
      case 'Firmada': return 'success';
      case 'Cerrada': return 'secondary';
      default: return 'info';
    }
  };

  // Función para descargar PDF desde el backend
  const handleDownloadPdf = async () => {
    if (!selectedSheet?._id) {
      alert('Error: ID de hoja de trabajo no disponible');
      return;
    }

    try {
      console.log('Abriendo PDF desde backend para sheet:', selectedSheet._id);
      
      const blob = await sheetworkService.getPDF(selectedSheet._id);
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert('Por favor permite ventanas emergentes para ver el PDF');
        URL.revokeObjectURL(url);
        return;
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      console.log('✅ PDF abierto exitosamente');
    } catch (error) {
      console.error('❌ Error al obtener PDF:', error);
      alert('Error al obtener el PDF del servidor. Intenta nuevamente.');
    }
  };

  const onPDFReports = async (sheetId: string) => {

    console.log('Generando PDF de reportes para la hoja: ', sheetId);
    if (!sheetId) return;
    setLoadingPdfSheets(prev => ({ ...prev, [sheetId]: true }));
    try {
      const tenantId = localStorage.getItem('tenantId');
      const response = await generateBulkPDF(
        { sheetworkId: sheetId },
        tenantId || undefined
      );
      console.log('PDF de reportes generado:', response);
    } catch (error) {
      console.error('Error al generar el PDF de reportes:', error);
    } finally {
      setLoadingPdfSheets(prev => {
        const copy = { ...prev };
        delete copy[sheetId];
        return copy;
      });
    }
  }

  return (
    <Card className="mb-4" style={{ position: 'relative' }}>
      {/* Overlay de carga durante descarga de PDF */}
      {isDownloadingPdf && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '0.25rem'
          }}
        >
          <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Generando PDF...</span>
          </Spinner>
          <div className="mt-3 fw-bold text-primary">Generando PDF...</div>
          <div className="text-muted small">Por favor espere</div>
        </div>
      )}
      
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          📋 Hojas de Trabajo ({hojasTrabajo.length})
        </h5>
        {reportesProcesados.length > 0 && (
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus className="me-1" />
            Crear Hoja
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Cargando hojas de trabajo...</span>
            </Spinner>
            <div className="mt-2 text-muted">Cargando hojas de trabajo...</div>
          </div>
        ) : isError ? (
          <Alert variant="danger">
            <Alert.Heading>Error al cargar hojas de trabajo</Alert.Heading>
            <p>{(error as Error)?.message || 'Ocurrió un error al cargar las hojas de trabajo'}</p>
            <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Alert>
        ) : hojasTrabajo.length === 0 ? (
          <Alert variant="info" className="text-center">
            <FaFilePdf size={32} className="mb-2 text-muted" />
            <div>No hay hojas de trabajo creadas</div>
            <small className="text-muted">
              {reportesProcesados.length > 0 
                ? 'Puede crear una hoja de trabajo con los equipos procesados'
                : 'Debe procesar equipos antes de crear hojas de trabajo'
              }
            </small>
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table hover>
              <thead className="table-light">
                <tr>
                  <th>Número</th>
                  <th>Equipos</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hojasTrabajo.map((hoja: SheetWork) => (
                  <tr key={hoja._id}>
                    <td>
                      <div className="fw-bold">
                        {hoja.numeroHoja}
                        {hoja.source === 'client-portal' && (
                          <Badge bg="info" className="ms-1">
                            Portal
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info">
                        {hoja.reports?.length || 0} equipos
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getEstadoColor(hoja.estado)}>
                        {hoja.estado}
                      </Badge>
                    </td>
                    <td>
                      {new Date(hoja.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline-info"
                          onClick={() => {
                            setSelectedSheet(hoja);
                            setShowPreviewModal(true);
                          }}
                        >
                          <FaEye className="me-1" />
                          Ver HT
                        </Button>
                        {hoja.estado === 'Borrador' && (
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => {
                              setSelectedSheet(hoja);
                              setShowSignModal(true);
                            }}
                          >
                            <FaSignature className="me-1" />
                            Firmar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={async () => {
                            if (!hoja._id) {
                              alert('Error: ID de hoja de trabajo no disponible');
                              return;
                            }

                            setIsDownloadingPdf(true);
                            try {
                              console.log('Abriendo PDF desde backend para hoja:', hoja._id);
                              const blob = await sheetworkService.getPDF(hoja._id);
                              const url = URL.createObjectURL(blob);
                              const newWindow = window.open(url, '_blank');
                              
                              if (!newWindow) {
                                alert('Por favor permite ventanas emergentes para ver el PDF');
                                URL.revokeObjectURL(url);
                                return;
                              }
                              
                              setTimeout(() => URL.revokeObjectURL(url), 100);
                              console.log('✅ PDF abierto exitosamente');
                            } catch (error) {
                              console.error('❌ Error al obtener PDF:', error);
                              alert('Error al obtener el PDF del servidor. Intenta nuevamente.');
                            } finally {
                              setIsDownloadingPdf(false);
                            }
                          }}
                          disabled={isDownloadingPdf}
                        >
                          {isDownloadingPdf ? (
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-1"
                            />
                          ) : (
                            <FaDownload className="me-1" />
                          )}
                          {isDownloadingPdf ? 'Generando...' : 'PDF'}
                        </Button>
                        {(() => {
                          const isLoadingPdf = loadingPdfSheets[hoja._id!] ?? false;
                          return (
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => setFilenameModalTarget(hoja)}
                              disabled={isLoadingPdf}
                            >
                              {isLoadingPdf ? (
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-1"
                                />
                              ) : (
                                <FaFilePdf className="me-1" />
                              )}
                              {isLoadingPdf ? 'Procesando...' : 'Reportes PDF'}
                            </Button>
                          );
                        })()}
                        {hoja.estado === 'EnviadaAFirmar' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              title="Reenviar solicitud de firma"
                              onClick={() => {
                                setResendTarget(hoja);
                                setShowResendModal(true);
                              }}
                            >
                              <FaEnvelope />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              title="Firmar en sitio"
                              onClick={() => {
                                setFallbackSignTarget(hoja);
                                fallbackSignRef.current?.reset();
                                setFallbackCanSubmit(false);
                                setShowFallbackSignModal(true);
                              }}
                            >
                              <FaSignature />
                            </Button>
                          </>
                        )}
                        {/* reason: the runtime SheetWork.reports payload includes `estado`
                            beyond the narrower typed subset in reporte.types.ts — interop
                            with the actual API response shape (sheet-report-closure). */}
                        {hoja.reports?.some((r: any) => r.estado === 'Procesado') && (() => {
                          const isClosingThis =
                            closeReportsMutation.isLoading &&
                            closeReportsMutation.variables === hoja._id;
                          return (
                            <Button
                              size="sm"
                              variant="outline-success"
                              title="Cerrar reportes de esta hoja"
                              onClick={() =>
                                closeReportsMutation.mutate(hoja._id!, {
                                  onSuccess: () => toast.success('Reportes cerrados'),
                                  onError: () => toast.error('No se pudo cerrar los reportes'),
                                })
                              }
                              disabled={isClosingThis}
                            >
                              {isClosingThis ? (
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                />
                              ) : (
                                <FaCheckSquare />
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* Modal Crear Hoja */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear Hoja de Trabajo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <div className="d-flex justify-content-between align-items-center">
              <span>Seleccione los equipos procesados que desea incluir en la hoja de trabajo</span>
              <Badge bg="primary">{selectedEquipos.length} seleccionados</Badge>
            </div>
          </Alert>
          
          {reportesProcesados.length === 0 ? (
            <Alert variant="warning">
              No hay equipos procesados disponibles para incluir en la hoja
            </Alert>
          ) : (
            <div>
              {/* Filtros */}
              <Card className="mb-3 border-0 bg-light">
                <Card.Body className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                      <FaFilter className="me-2" />
                      Filtros
                    </h6>
                    {hasActiveFilters && (
                      <Button 
                        size="sm" 
                        variant="outline-secondary"
                        onClick={handleClearFilters}
                      >
                        <FaTimes className="me-1" />
                        Limpiar
                      </Button>
                    )}
                  </div>

                  <Row className="g-2">
                    <Col md={6}>
                      <InputGroup size="sm">
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Buscar por nombre, marca, modelo, serie, sede..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    {/* select para servicio*/}
                    <Col md={6}>
                      <Form.Select 
                        size="sm"
                        value={filterServicio}
                        onChange={(e) => setFilterServicio(e.target.value)}
                      >
                        <option value="">Todas los servicios</option>
                        {servicios.map(servicio => (
                          <option key={servicio} value={servicio}>{servicio}</option>
                        ))}
                      </Form.Select>
                    </Col>



                    <Col md={3}>
                      <Form.Select 
                        size="sm"
                        value={filterMarca}
                        onChange={(e) => setFilterMarca(e.target.value)}
                      >
                        <option value="">Todas las marcas</option>
                        {marcas.map(marca => (
                          <option key={marca} value={marca}>{marca}</option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={3}>
                      <Form.Select 
                        size="sm"
                        value={filterModelo}
                        onChange={(e) => setFilterModelo(e.target.value)}
                      >
                        <option value="">Todos los modelos</option>
                        {modelos.map(modelo => (
                          <option key={modelo} value={modelo}>{modelo}</option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col md={3}>
                      <Form.Control
                        size="sm"
                        placeholder="Filtrar por serie"
                        value={filterSerie}
                        onChange={(e) => setFilterSerie(e.target.value)}
                      />
                    </Col>

                    <Col md={3}>
                      <Form.Select 
                        size="sm"
                        value={filterSede}
                        onChange={(e) => setFilterSede(e.target.value)}
                      >
                        <option value="">Todas las sedes</option>
                        {sedes.map(sede => (
                          <option key={sede} value={sede}>{sede}</option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <div className="mt-2">
                    <small className="text-muted">
                      Mostrando {filteredReportes.length} de {reportesProcesados.length} equipos
                      {hasActiveFilters && ' (filtrado)'}
                    </small>
                  </div>
                </Card.Body>
              </Card>

              {/* Botón Select All de visibles */}
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <Button 
                  size="sm" 
                  variant={allVisibleSelected ? "outline-danger" : "outline-primary"}
                  onClick={handleToggleAllVisible}
                  disabled={filteredReportes.length === 0}
                >
                  {allVisibleSelected 
                    ? 'Deseleccionar Visibles' 
                    : 'Seleccionar Visibles'
                  }
                  {filteredReportes.length > 0 && ` (${filteredReportes.length})`}
                </Button>
                
                {hasActiveFilters && selectedEquipos.length > 0 && (
                  <small className="text-muted">
                    Tip: Las selecciones se preservan al cambiar filtros
                  </small>
                )}
              </div>

              {/* Lista de equipos */}
              {filteredReportes.length === 0 ? (
                <Alert variant="warning" className="text-center">
                  <FaFilter className="mb-2" />
                  <div>No hay equipos que coincidan con los filtros</div>
                  <Button 
                    size="sm" 
                    variant="link" 
                    onClick={handleClearFilters}
                  >
                    Limpiar filtros
                  </Button>
                </Alert>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredReportes.map((reporte) => (
                    <div key={reporte._id} className="border rounded p-3 mb-2">
                      <div className="d-flex align-items-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedEquipos.includes(reporte._id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEquipos([...selectedEquipos, reporte._id!]);
                            } else {
                              setSelectedEquipos(selectedEquipos.filter(id => id !== reporte._id));
                            }
                          }}
                          className="me-3"
                        />
                        <div className="flex-grow-1">
                          <div className="fw-bold">{reporte.equipoSnapshot.ItemText}</div>
                          <small className="text-muted">
                            {reporte.equipoSnapshot.Marca} • {reporte.equipoSnapshot.Modelo}
                            {reporte.equipoSnapshot.Serie && ` • Serie: ${reporte.equipoSnapshot.Serie}`}
                            {reporte.equipoSnapshot.Servicio && ` • Servicio: ${reporte.equipoSnapshot.Servicio}`}
                            {reporte.equipoSnapshot.Ubicacion && ` • Ubicación: ${reporte.equipoSnapshot.Ubicacion}`}
                          </small>
                          {reporte.equipoSnapshot.Sede && (
                            <div className="small">
                              <Badge bg="secondary" className="me-1">
                                {reporte.equipoSnapshot.Sede} 
                              </Badge>
                            </div>
                          )}
                  
                          <div className="small text-success">
                            Procesado: {new Date(reporte.fechaProcesado).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleProceedToSign}
            disabled={selectedEquipos.length === 0}
          >
            <FaSignature className="me-1" />
            Continuar a Firma ({selectedEquipos.length} equipos)
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Firma al Crear Hoja — Tabs: En Sitio / Remota */}
      <Modal
        show={showSignCreateModal}
        onHide={() => setShowSignCreateModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaSignature className="me-2" />
            Firma de Creación de Hoja de Trabajo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={signCreateActiveTab}
            onSelect={(k) => setSignCreateActiveTab((k as 'inplace' | 'remote') || 'inplace')}
            className="mb-3"
          >
            <Tab eventKey="inplace" title="Firma en Sitio">
              <Alert variant="info">
                Complete los siguientes datos y firme para crear la hoja de trabajo con {selectedEquipos.length} equipo(s) seleccionado(s).
              </Alert>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Recibe <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre de quien recibe"
                        value={recibeNombre}
                        onChange={(e) => setRecibeNombre(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">Nombre completo de la persona que recibe</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Cargo <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Cargo de quien recibe"
                        value={recibeCargo}
                        onChange={(e) => setRecibeCargo(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">Cargo o posición en la empresa</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Firma <span className="text-danger">*</span>
                  </Form.Label>
                  <SignatureInput ref={createSignatureRef} onChange={handleCreateSignatureChange} />
                </Form.Group>
              </Form>

              <Alert variant="warning" className="mb-0 mt-3">
                <small>
                  <strong>Nota:</strong> Todos los campos son obligatorios. La firma confirma la recepción de la hoja de trabajo.
                </small>
              </Alert>
            </Tab>

            <Tab eventKey="remote" title="Firma Remota">
              <RemoteSignSection
                otId={otId}
                reportIds={selectedEquipos}
                clientEmail={customerData?.Email}
                correousados={customerData?.correousados}
                onSuccess={() => {
                  setShowSignCreateModal(false);
                  setSelectedEquipos([]);
                  setTimeout(() => refetch(), 500);
                }}
              />
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSignCreateModal(false);
              setShowCreateModal(true);
            }}
          >
            Volver
          </Button>
          {signCreateActiveTab === 'inplace' && (
            <Button
              variant="success"
              onClick={handleCreateSheetWithSignature}
              disabled={!hasCreateSignature}
            >
              <FaSignature className="me-1" />
              Crear Hoja con Firma
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal Reenviar solicitud de firma (EnviadaAFirmar) */}
      <ResendSignModal
        show={showResendModal}
        onHide={() => setShowResendModal(false)}
        otId={otId}
        sheetId={resendTarget?._id || null}
        currentEmail={resendTarget?.remoteSignRequest?.email || customerData?.Email || null}
        numeroHoja={resendTarget?.numeroHoja || null}
      />

      {/* Modal Firma en sitio (fallback para EnviadaAFirmar) */}
      <Modal
        show={showFallbackSignModal}
        onHide={() => setShowFallbackSignModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaSignature className="me-2" />
            Firmar HT {fallbackSignTarget?.numeroHoja || ''} en sitio
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            El enlace de firma remota quedará invalidado. Solo continúa si el cliente
            está firmando presencialmente.
          </Alert>
          <InPlaceSignSection
            ref={fallbackSignRef}
            onChange={() => setFallbackCanSubmit(!(fallbackSignRef.current?.hasErrors() ?? true))}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFallbackSignModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            disabled={!fallbackCanSubmit || signInPlaceMutation.isPending}
            onClick={async () => {
              if (!fallbackSignTarget?._id) return;
              const pngBase64 = fallbackSignRef.current?.getPngBase64();
              if (!pngBase64) return;
              const values = fallbackSignRef.current!.values();
              try {
                await signInPlaceMutation.mutateAsync({
                  sheetId: fallbackSignTarget._id,
                  signature: {
                    imagePng: pngBase64,
                    signerName: values.recibe,
                    cargo: values.cargo,
                    observaciones: values.observaciones,
                  },
                  personaRecibe: values.recibe,
                  cargoRecibe: values.cargo,
                  observaciones: values.observaciones,
                });
                setShowFallbackSignModal(false);
                setFallbackSignTarget(null);
                setTimeout(() => refetch(), 500);
              } catch {
                // toast surfaced by the hook
              }
            }}
          >
            <FaSignature className="me-1" />
            Firmar y cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Firmar */}
      <Modal show={showSignModal} onHide={() => setShowSignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Firma del Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Una vez firmada, la hoja de trabajo no podrá modificarse
          </Alert>
          
          {selectedSheet && (
            <div className="mb-3">
              <strong>Hoja:</strong> {selectedSheet.numeroHoja}<br />
              <strong>Equipos:</strong> {selectedSheet.reports?.length || 0}<br />
              <strong>Fecha:</strong> {new Date(selectedSheet.fechaCreacion).toLocaleDateString('es-ES')}
            </div>
          )}

          <Form.Group>
            <Form.Label>Nombre y Firma del Cliente</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del cliente que firma"
              value={firmaCliente}
              onChange={(e) => setFirmaCliente(e.target.value)}
            />
            <Form.Text className="text-muted">
              El cliente confirma la recepción del mantenimiento realizado
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSignModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSignSheet}
            disabled={!firmaCliente.trim()}
          >
            <FaSignature className="me-1" />
            Confirmar Firma
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Vista Previa HT - Usando componente reutilizable */}
      <PreviewSheetWorkModal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        sheetWork={selectedSheet}
        tenantData={tenantData}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Modal — Nombre dinámico de los reportes PDF (pdf-reports-filename-builder) */}
      <PdfReportsFilenameModal
        show={Boolean(filenameModalTarget)}
        onHide={() => setFilenameModalTarget(null)}
        sheetworkId={filenameModalTarget?._id || null}
        sampleReport={
          filenameModalTarget?.reports?.find((r: any) => r?.estado !== 'Cancelado') ||
          filenameModalTarget?.reports?.[0] ||
          null
        }
      />
    </Card>
  );
};

export default WorkSheets;