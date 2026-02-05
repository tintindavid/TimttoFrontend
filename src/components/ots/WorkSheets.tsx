import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Alert, Row, Col, InputGroup, Spinner } from 'react-bootstrap';
import { SheetWork } from '@/types/reporte.types';
import { FaFilePdf, FaSignature, FaPlus, FaDownload, FaSearch, FaFilter, FaTimes, FaEraser, FaEye, FaPrint } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import { useWorkSheets } from '@/hooks/useReportes';
import { useAuth } from '@/context/AuthContext';
import './WorkSheets.css';
import { useCurrentUserData } from '@/context/userContext';
import { ca } from 'date-fns/locale';
import { generateBulkPDF } from '@/services/descargarPdf.service';

interface WorkSheetsProps {
  otId: string;
  reportesProcesados: any[];
  onCreateSheet: (equiposIds: string[], datosRecepcion?: { recibe: string; cargo: string; firma: string; responsable: string ; cargoResponsable?: string; fullName?: string; firmaResponsableFile?: string; clienteId?: string }) => void;
  onSignSheet: (sheetId: string, firma: string) => void;
  clienteId: string;
}
const WorkSheets: React.FC<WorkSheetsProps> = ({
  otId,
  reportesProcesados,
  onCreateSheet,
  onSignSheet,
  clienteId,
}) => {
  // Obtener usuario en sesión (useCurrentUserData ya maneja el caching con React Query)
  const { token } = useAuth();
  const currentUserData = useCurrentUserData();
  
  // Obtener hojas de trabajo desde el backend
  const { data: hojasTrabajo = [], isLoading, isError, error, refetch } = useWorkSheets(otId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showSignCreateModal, setShowSignCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<SheetWork | null>(null);
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>([]);
  const [firmaCliente, setFirmaCliente] = useState('');
  
  console.log('selected HT: ', selectedSheet);
  // Estados para firma al crear hoja
  const [recibeNombre, setRecibeNombre] = useState('');
  const [recibeCargo, setRecibeCargo] = useState('');
  const signaturePadRef = useRef<SignatureCanvas>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [filterSerie, setFilterSerie] = useState('');
  const [filterSede, setFilterSede] = useState('');

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

      return true;
    });
  }, [reportesProcesados, searchTerm, filterMarca, filterModelo, filterSerie, filterSede]);

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
    if (signaturePadRef.current?.isEmpty()) {
      alert('Debe firmar para crear la hoja de trabajo');
      return;
    }

    // Validar que tengamos datos del usuario
    if (!currentUserData?._id) {
      alert('Error: No se pudo obtener la información del usuario. Por favor, inicia sesión nuevamente.');
      console.error('No user data available:', currentUserData);
      return;
    }

    // Obtener firma como imagen base64
    const firmaBase64 = signaturePadRef.current?.toDataURL();    
    // Enviar equipos con datos de recepción
    onCreateSheet(selectedEquipos, {
      recibe: recibeNombre,
      cargo: recibeCargo,
      firma: firmaBase64 || '',
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
    signaturePadRef.current?.clear();
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
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
      case 'Firmada': return 'success';
      case 'Cerrada': return 'secondary';
      default: return 'info';
    }
  };

  const onPDFReports = async (sheetId: string) => {

    console.log('Generando PDF de reportes para la hoja: ', sheetId);
    try {
      const tenantId = localStorage.getItem('tenantId');
      const response = await generateBulkPDF(
        { sheetworkId: sheetId },
        tenantId || undefined
      );
      console.log('PDF de reportes generado:', response);
    } catch (error) {
      console.error('Error al generar el PDF de reportes:', error);
    }
  }

  return (
    <Card className="mb-4">
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
                      <div className="fw-bold">{hoja.numeroHoja}</div>
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
                        <Button size="sm" variant="outline-secondary">
                          <FaDownload className="me-1" />
                          PDF
                        </Button>
                        <Button size="sm" variant="outline-secondary"
                          onClick={() => onPDFReports(hoja._id!)}
                        >
                          <FaFilePdf className="me-1" />
                          Reportes PDF
                        </Button>
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
                    <Col md={12}>
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

      {/* Modal Firma al Crear Hoja */}
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
          <Alert variant="info">
            Complete los siguientes datos y firme para crear la hoja de trabajo con {selectedEquipos.length} equipo(s) seleccionado(s)
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
                  <Form.Text className="text-muted">
                    Nombre completo de la persona que recibe
                  </Form.Text>
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
                  <Form.Text className="text-muted">
                    Cargo o posición en la empresa
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>
                Firma <span className="text-danger">*</span>
              </Form.Label>
              <div 
                className="signature-container border rounded bg-white p-2"
                style={{ 
                  position: 'relative',
                  touchAction: 'none'
                }}
              >
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: 'signature-canvas',
                    style: {
                      width: '100%',
                      height: '200px',
                      border: '2px dashed #dee2e6',
                      borderRadius: '4px',
                      cursor: 'crosshair'
                    }
                  }}
                />
              </div>
              <div className="mt-2 d-flex justify-content-between align-items-center">
                <Form.Text className="text-muted">
                  Firme en el recuadro usando el mouse o pantalla táctil
                </Form.Text>
                <Button 
                  size="sm" 
                  variant="outline-secondary"
                  onClick={handleClearSignature}
                >
                  <FaEraser className="me-1" />
                  Limpiar Firma
                </Button>
              </div>
            </Form.Group>
          </Form>

          <Alert variant="warning" className="mb-0 mt-3">
            <small>
              <strong>Nota:</strong> Todos los campos son obligatorios. La firma confirma la recepción de la hoja de trabajo.
            </small>
          </Alert>
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
          <Button 
            variant="success" 
            onClick={handleCreateSheetWithSignature}
          >
            <FaSignature className="me-1" />
            Crear Hoja con Firma
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

      {/* Modal Vista Previa HT */}
      <Modal 
        show={showPreviewModal} 
        onHide={() => setShowPreviewModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFilePdf className="me-2 text-danger" />
            Vista Previa - Hoja de Trabajo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {selectedSheet && (
            <div 
              className="bg-white shadow-sm p-4" 
              style={{ 
                maxHeight: '70vh', 
                overflowY: 'auto',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              {/* Encabezado estilo PDF */}
              <div className="text-center mb-4 pb-3 border-bottom border-2">
                <h3 className="mb-2 text-primary fw-bold">HOJA DE TRABAJO</h3>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <strong>Número:</strong> {selectedSheet.numeroHoja}
                  </div>
                  <div>
                    <strong>Fecha:</strong> {new Date(selectedSheet.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div>
                    <Badge bg={getEstadoColor(selectedSheet.estado)} className="fs-6">
                      {selectedSheet.estado}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              {(selectedSheet as any).clienteId && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h5 className="mb-3 text-secondary">
                    🏢 Información del Cliente
                  </h5>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2">
                        <strong>Razón Social:</strong> {(selectedSheet as any).clienteId.Razonsocial || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>NIT:</strong> {(selectedSheet as any).clienteId.Nit || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Dirección:</strong> {(selectedSheet as any).clienteId.Direccion || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2">
                        <strong>Ciudad:</strong> {(selectedSheet as any).clienteId.Ciudad || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Departamento:</strong> {(selectedSheet as any).clienteId.Departamento || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Teléfono:</strong> {(selectedSheet as any).clienteId.TelContacto || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <strong>Email:</strong> {(selectedSheet as any).clienteId.Email || 'N/A'}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Listado de Equipos */}
              <div className="mb-4">
                <h5 className="mb-3 text-secondary border-bottom pb-2">
                  📋 Equipos Procesados ({selectedSheet.reports?.length || 0})
                </h5>
                
                {selectedSheet.reports && selectedSheet.reports.length > 0 ? (
                  <div className="table-responsive">
                    <Table bordered hover size="sm">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '30%' }}>Equipo</th>
                          <th style={{ width: '15%' }}>Marca</th>
                          <th style={{ width: '10%' }}>Modelo</th>
                          <th style={{ width: '10%' }}>Serie</th>
                          <th style={{ width: '10%' }}>Sede</th>
                          <th style={{ width: '20%' }}>Servicio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/*mapear  selectedSheet.reports que tiene la informacion de los equipos*/}
                        {selectedSheet.reports.map((equipo, index) => {
                          const equipoId = equipo._id;
                          return (
                            <tr key={equipoId}>
                              <td className="text-center fw-bold">{index + 1}</td>
                              <td>{equipo?.equipoSnapshot?.ItemText || 'N/A'}</td>
                              <td>{equipo?.equipoSnapshot?.Marca || 'N/A'}</td>
                              <td>{equipo?.equipoSnapshot?.Modelo || 'N/A'}</td>
                              <td>{equipo?.equipoSnapshot?.Serie || 'N/A'}</td>
                              <td>{equipo?.equipoSnapshot?.Sede || 'N/A'}</td>
                              <td>{equipo?.equipoSnapshot?.Servicio || 'N/A'}
                                <small> {equipo?.equipoSnapshot?.Ubicacion || 'N/A'}</small>
                              </td>
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
              {((selectedSheet as any).firmaFile || (selectedSheet as any).firmaResponsable) && (
                <div className="mt-4 pt-3 border-top">
                  <h5 className="mb-3 text-secondary">
                    ✍️ Firmas
                  </h5>
                  <Row>
                  {/* Firma del Responsable del Servicio */}
                    {(selectedSheet as any).firmaResponsableFile && (
                      <Col md={6}>
                        <div className="text-center p-3 bg-light rounded ms-2">
                          <h6 className="mb-3 text-success">Firma del Responsable del Servicio</h6>
                          <img 
                            src={(selectedSheet as any).firmaResponsableFile} 
                            alt="Firma del responsable del servicio" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '150px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              backgroundColor: 'white'
                            }}
                          />
                          <div className="mt-3">
                            <div className="fw-bold">
                              <strong>Responsable: </strong>{(selectedSheet as any).fullNameResponsable || 'N/A'}</div>
                            <small className="text-muted">
                              <strong>Cargo: </strong> {(selectedSheet as any).cargoResponsable || 'Técnico de Servicio'}</small>
                          </div>
                        </div>
                      </Col>
                    )}
                    {/* Firma del que Recibe */}
                    {(selectedSheet as any).firmaFile && (
                      <Col md={6}>
                        <div className="text-center p-3 bg-light rounded me-2">
                          <h6 className="mb-3 text-primary">Firma del que Recibe</h6>
                          <img 
                            src={(selectedSheet as any).firmaFile} 
                            alt="Firma del que recibe" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '150px',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              backgroundColor: 'white'
                            }}
                          />
                          <div className="mt-3">
                            <div className="fw-bold">
                              <strong>Recibe: </strong>{(selectedSheet as any).personaRecibe}</div>
                            <small className="text-muted">
                              <strong>Cargo: </strong> {(selectedSheet as any).cargoRecibe}</small>
                          </div>
                        </div>
                      </Col>
                    )}

                    {/* Si solo hay una firma, centrarla */}
                    {((selectedSheet as any).firmaFile && !(selectedSheet as any).firmaResponsable) && (
                      <Col md={6}></Col>
                    )}
                    {(!(selectedSheet as any).firmaFile && (selectedSheet as any).firmaResponsable) && (
                      <Col md={6}></Col>
                    )}
                  </Row>
                </div>
              )}

              {/* Firma del Cliente (si está firmada) */}
              {selectedSheet.estado === 'Firmada' && (selectedSheet as any).firmaCliente && (
                <div className="mt-4 pt-3 border-top">
                  <h5 className="mb-3 text-secondary">
                    ✍️ Firma del Cliente
                  </h5>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fw-bold mb-2">{(selectedSheet as any).firmaCliente}</div>
                    <small className="text-muted">
                      Firmado el: {(selectedSheet as any).fechaFirma 
                        ? new Date((selectedSheet as any).fechaFirma).toLocaleDateString('es-ES')
                        : 'N/A'
                      }
                    </small>
                  </div>
                </div>
              )}

              {/* Pie de página */}
              <div className="mt-4 pt-3 border-top text-center text-muted">
                <small>
                  Documento generado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
                </small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => window.print()}
          >
            <FaPrint className="me-1" />
            Imprimir
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default WorkSheets;