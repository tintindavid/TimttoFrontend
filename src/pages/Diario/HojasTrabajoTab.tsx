import React, { useState, useMemo, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  Row,
  Col,
  InputGroup,
  Spinner,
} from 'react-bootstrap';
import Select from 'react-select';
import {
  FaFilePdf,
  FaSignature,
  FaEye,
  FaSearch,
  FaFilter,
  FaTimes,
  FaEraser,
  FaPrint,
  FaDownload,
} from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import { useAllWorkSheets, useSignWorkSheet } from '@/hooks/useReportes';
import { useCustomers } from '@/hooks/useCustomers';
import { SheetWork } from '@/types/reporte.types';
import { sheetworkService } from '@/services/sheetwork.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PreviewSheetWorkModal from '@/components/common/PreviewSheetWorkModal';
import tenantService from '@/services/tenant.service';
import { useAuth } from '@/context/AuthContext';
import { useCurrentUserData } from '@/context/userContext';


/**
 * Tab de Hojas de Trabajo
 * Muestra todas las hojas de trabajo con filtros y acciones
 */
const HojasTrabajoTab: React.FC = () => {
  // Estados para filtros
  const [page, setPage] = useState(1);
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [numeroHoja, setNumeroHoja] = useState('');

  const limit = 20;

  // Queries
  const {
    data: worksheetsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllWorkSheets({
    page,
    limit,
    clienteId: clienteId || undefined,
    estado: estado || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    numeroHoja: numeroHoja || undefined,
  });

  const { data: customersData } = useCustomers();
  const signWorkSheetMutation = useSignWorkSheet();

  // Estados para modales
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<SheetWork | null>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [firmaCliente, setFirmaCliente] = useState('');
  const signaturePadRef = useRef<SignatureCanvas>(null);
  //data usuario
  const usuarioData= useCurrentUserData()

  //funcion useeffect asincrona para obtener tenant data con el tenantId del usuario
  React.useEffect(() => {
    const fetchTenantData = async () => {
      if (!usuarioData?.tenantId) {
        return;
      }
      
      try {
        const response = await tenantService.getById(usuarioData?.tenantId || '');
        setTenantData(response.data || null);
      } catch (error) {
        console.error('Error al obtener tenant data:', error);
      }
    };

    fetchTenantData();
  }, [usuarioData?.tenantId]);


  // Estado para PDF loading
  const [loadingPdf, setLoadingPdf] = useState<Record<string, boolean>>({});

  // Opciones para selects
  const customerOptions = useMemo(() => {
    if (!customersData?.data) return [];
    return [...customersData.data]
      .sort((a, b) =>
        (a.Razonsocial || '').toUpperCase().localeCompare((b.Razonsocial || '').toUpperCase())
      )
      .map((c) => ({
        value: c._id!,
        label: c.Razonsocial || 'Sin nombre',
      }));
  }, [customersData?.data]);

  const estadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'Borrador', label: 'Borrador' },
    { value: 'Firmada', label: 'Firmada' },
    { value: 'Cerrada', label: 'Cerrada' },
  ];

  // Verificar si hay filtros activos
  const hasActiveFilters = clienteId || estado || startDate || endDate || numeroHoja;

  // Hojas de trabajo
  const worksheets = worksheetsData?.data || [];

  console.log('Hojas de trabajo obtenidas:', worksheets);
  const totalPages = worksheetsData?.pagination?.pages || 1;

  // Handlers
  const handleClearFilters = () => {
    setClienteId('');
    setEstado('');
    setStartDate('');
    setEndDate('');
    setNumeroHoja('');
    setPage(1);
  };

  const handleSignSheet = async () => {
    if (!selectedSheet || signaturePadRef.current?.isEmpty()) {
      alert('Debe firmar para continuar');
      return;
    }

    const firmaBase64 = signaturePadRef.current?.toDataURL();

    try {
      await signWorkSheetMutation.mutateAsync({
        id: selectedSheet._id!,
        firmaCliente: firmaBase64 || '',
      } as any);

      refetch();
      setShowSignModal(false);
      setSelectedSheet(null);
      signaturePadRef.current?.clear();
    } catch (error) {
      console.error('Error al firmar hoja:', error);
      alert('Error al firmar la hoja de trabajo');
    }
  };

  const handleDownloadPdf = async (sheet: SheetWork) => {
    if (!sheet._id) {
      alert('Error: ID de hoja de trabajo no disponible');
      return;
    }

    setLoadingPdf((prev) => ({ ...prev, [sheet._id!]: true }));
    
    try {
      console.log('Abriendo PDF desde backend para sheet:', sheet._id);
      
      // Obtener blob del PDF desde el backend
      const blob = await sheetworkService.getPDF(sheet._id);
      
      // Crear URL temporal para el blob
      const url = URL.createObjectURL(blob);
      
      // Abrir en nueva pestaña
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        alert('Por favor permite ventanas emergentes para ver el PDF');
        URL.revokeObjectURL(url);
        return;
      }
      
      // Limpiar URL después de un tiempo
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ PDF abierto exitosamente');
    } catch (error) {
      console.error('❌ Error al obtener PDF:', error);
      alert('Error al obtener el PDF del servidor. Intenta nuevamente.');
    } finally {
      setLoadingPdf((prev) => {
        const copy = { ...prev };
        delete copy[sheet._id!];
        return copy;
      });
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
    <Card>
      <Card.Header>
        <h5 className="mb-0">📋 Hojas de Trabajo</h5>
      </Card.Header>
      <Card.Body>
        {/* Filtros */}
        <Card className="mb-3 border-0 bg-light">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Filtros
              </h6>
              {hasActiveFilters && (
                <Button size="sm" variant="outline-secondary" onClick={handleClearFilters}>
                  <FaTimes className="me-1" />
                  Limpiar
                </Button>
              )}
            </div>

            <Row className="g-2">
              <Col md={3}>
                <Form.Label className="small mb-1">Cliente</Form.Label>
                <Select
                  options={[{ value: '', label: 'Todos los clientes' }, ...customerOptions]}
                  value={
                    customerOptions.find((opt) => opt.value === clienteId) || {
                      value: '',
                      label: 'Todos los clientes',
                    }
                  }
                  onChange={(selected) => {
                    setClienteId(selected?.value || '');
                    setPage(1);
                  }}
                  placeholder="Seleccionar cliente..."
                  isSearchable
                  isClearable
                  noOptionsMessage={() => 'No hay clientes'}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Estado</Form.Label>
                <Form.Select size="sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {estadoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Fecha desde</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small mb-1">Fecha hasta</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </Col>

              <Col md={3}>
                <Form.Label className="small mb-1">Buscar por número</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Número de hoja..."
                    value={numeroHoja}
                    onChange={(e) => {
                      setNumeroHoja(e.target.value);
                      setPage(1);
                    }}
                  />
                </InputGroup>
              </Col>
            </Row>

            <div className="mt-2">
              <small className="text-muted">
                Mostrando {worksheets.length} de {worksheetsData?.pagination?.total || 0} hojas de
                trabajo
                {hasActiveFilters && ' (filtrado)'}
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Tabla de hojas */}
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <div className="mt-2 text-muted">Cargando hojas de trabajo...</div>
          </div>
        ) : isError ? (
          <Alert variant="danger">
            <Alert.Heading>Error al cargar hojas de trabajo</Alert.Heading>
            <p>{(error as Error)?.message || 'Ocurrió un error'}</p>
            <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </Alert>
        ) : worksheets.length === 0 ? (
          <Alert variant="info" className="text-center">
            <FaFilePdf size={32} className="mb-2 text-muted" />
            <div>No se encontraron hojas de trabajo</div>
            <small className="text-muted">
              {hasActiveFilters
                ? 'Intenta ajustar los filtros'
                : 'No hay hojas de trabajo creadas'}
            </small>
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Equipos</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {worksheets.map((hoja: SheetWork) => (
                    <tr key={hoja._id}>
                      <td>
                        <div className="fw-bold">{hoja.numeroHoja}</div>
                      </td>
                      <td>
                        <div>{(hoja as any).clienteId?.Razonsocial || 'N/A'}</div>
                        <small className="text-muted">{(hoja as any).clienteId?.Nit || ''}</small>
                      </td>
                      <td>
                        <Badge bg="info">{hoja.reports?.length || 0} equipos</Badge>
                      </td>
                      <td>
                        <Badge bg={hoja.estado ? getEstadoColor(hoja.estado) : 
                            hoja.firmaFile ? getEstadoColor('Firmada') : 'warning'
                        }>{hoja.estado || (hoja.firmaFile ? 'Firmada' : 'N/A')}</Badge>
                      </td>
                      <td>
                        {hoja.fullNameResponsable || 'N/A'}
                      </td>
                      <td>
                        {hoja.createdAt ? (
                          <>
                            {format(new Date(hoja.createdAt), 'dd/MM/yyyy', { locale: es })}
                            <div className="small text-muted">
                              {format(new Date(hoja.createdAt), 'HH:mm', { locale: es })}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
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
                            Ver
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
                            onClick={() => handleDownloadPdf(hoja)}
                            disabled={loadingPdf[hoja._id!]}
                          >
                            {loadingPdf[hoja._id!] ? (
                              <Spinner as="span" animation="border" size="sm" className="me-1" />
                            ) : (
                              <FaDownload className="me-1" />
                            )}
                            PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <div className="btn-group">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline-primary" disabled>
                    Página {page} de {totalPages}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card.Body>

      {/* Modal Firmar */}
      <Modal show={showSignModal} onHide={() => setShowSignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaSignature className="me-2" />
            Firmar Hoja de Trabajo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Una vez firmada, la hoja de trabajo no podrá modificarse
          </Alert>

          {selectedSheet && (
            <div className="mb-3">
              <strong>Hoja:</strong> {selectedSheet.numeroHoja}
              <br />
              <strong>Equipos:</strong> {selectedSheet.reports?.length || 0}
              <br />
              <strong>Fecha:</strong>{' '}
              {selectedSheet.createdAt && format(new Date(selectedSheet.createdAt), 'dd/MM/yyyy', { locale: es })}
            </div>
          )}

          <Form.Group>
            <Form.Label>Firma del Cliente</Form.Label>
            <div
              className="signature-container border rounded bg-white p-2"
              style={{
                position: 'relative',
                touchAction: 'none',
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
                    cursor: 'crosshair',
                  },
                }}
              />
            </div>
            <div className="mt-2 d-flex justify-content-between align-items-center">
              <Form.Text className="text-muted">Firme en el recuadro</Form.Text>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => signaturePadRef.current?.clear()}
              >
                <FaEraser className="me-1" />
                Limpiar
              </Button>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSignModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSignSheet}>
            <FaSignature className="me-1" />
            Confirmar Firma
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Vista Previa - Usando componente reutilizable */}
      <PreviewSheetWorkModal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        sheetWork={selectedSheet}
        tenantData={tenantData}
        onDownloadPdf={() => selectedSheet && handleDownloadPdf(selectedSheet)}
      />
    </Card>
  );
};

export default HojasTrabajoTab;
