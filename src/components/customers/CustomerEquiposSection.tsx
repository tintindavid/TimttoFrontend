import React, { useState, useMemo, useCallback } from 'react';
import { 
  Button, Table, Badge, Row, Col, 
  Spinner, Alert, Dropdown, Form, Card, Nav, Tab, InputGroup 
} from 'react-bootstrap';
import Select from 'react-select';
import { FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { EquipoItem } from '@/types/equipoItem.types';
import EquipoForm from '@/components/equipos/EquipoForm';
import EquipoBulkUpload from '@/components/equipos/EquipoBulkUpload';
import AppPagination from '@/components/common/Pagination';
import { Navigate, useNavigate } from 'react-router-dom';
import DownloadInventarioModal from './DownloadInventarioModal';
import { generarCronogramaPDF } from '@/services/cronograma.service';

interface CustomerEquiposSectionProps {
  customerId: string;
}

const CustomerEquiposSection: React.FC<CustomerEquiposSectionProps> = ({ customerId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sedeFilter, setSedeFilter] = useState<string>('');
  const [servicioFilter, setServicioFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'bulk'>('list');
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // Items por página
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [loadingCronograma, setLoadingCronograma] = useState(false);

  const navigate = useNavigate();

  const handleImprimirCronograma = useCallback(async () => {
    try {
      setLoadingCronograma(true);
      await generarCronogramaPDF({ clienteId: customerId });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al generar el cronograma PDF'
      );
    } finally {
      setLoadingCronograma(false);
    }
  }, [customerId]);

  // Parámetros de query - solo para paginación, filtros en cliente
  const queryParams = useMemo(() => {
    if (!customerId) return null;
    const params = {
      ClienteId: customerId,
      page: 1, // Cargar todos en página 1
      limit: 1000 // Límite alto para traer todos los equipos
    };
    
    console.log('🔍 Query Params construidos:', params);
    return params;
  }, [customerId]);

  // Queries optimizadas con enabled condicional
  const { data: equiposData, isLoading, error, refetch } = useEquipoItems(queryParams);
  
  // Siempre cargar sedes y servicios para los filtros (son necesarios en todos los tabs)
  const { data: sedesData } = useSedesByCustomer(customerId, {}, {
    enabled: !!customerId
  });
  
  const { data: serviciosData } = useServiciosByCustomer(customerId, {}, {
    enabled: !!customerId
  });

  // Datos procesados y memoizados
  const equiposRaw = useMemo(() => equiposData?.data || [], [equiposData?.data]);

  console.log('equiposData', equiposRaw);
  const sedes = useMemo(() => sedesData?.data || [], [sedesData?.data]); 
  const servicios = useMemo(() => serviciosData?.data || [], [serviciosData?.data]);

  // Opciones ordenadas para filtros
  const sedeOptions = useMemo(() => {
    return [...sedes]
      .sort((a, b) => {
        const nameA = (a.nombreSede || '').toUpperCase();
        const nameB = (b.nombreSede || '').toUpperCase();
        return nameA.localeCompare(nameB);
      })
      .map(s => ({
        value: s._id!,
        label: s.nombreSede || 'Sin nombre'
      }));
  }, [sedes]);

  const servicioOptions = useMemo(() => {
    return [...servicios]
      .sort((a, b) => {
        const nameA = (a.nombre || '').toUpperCase();
        const nameB = (b.nombre || '').toUpperCase();
        return nameA.localeCompare(nameB);
      })
      .map(s => ({
        value: s._id!,
        label: s.nombre || 'Sin nombre'
      }));
  }, [servicios]);

  // Filtrado y ordenamiento en cliente
  const filteredAndSortedEquipos = useMemo(() => {
    let result = [...equiposRaw];

    // Filtrar por búsqueda (nombre, marca, modelo, serie, inventario)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(equipo => 
        equipo.ItemId?.Nombre?.toLowerCase().includes(query) ||
        equipo.Marca?.toLowerCase().includes(query) ||
        equipo.Modelo?.toLowerCase().includes(query) ||
        equipo.Serie?.toLowerCase().includes(query) ||
        equipo.Inventario?.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (statusFilter) {
      result = result.filter(equipo => equipo.Estado === statusFilter);
    }

    // Filtrar por sede
    if (sedeFilter) {
      result = result.filter(equipo => equipo.SedeId?._id === sedeFilter);
    }

    // Filtrar por servicio
    if (servicioFilter) {
      result = result.filter(equipo => equipo.Servicio?._id === servicioFilter);
    }

    // Ordenar por nombre del equipo (ItemId.Nombre)
    result.sort((a, b) => {
      const nameA = a.ItemId?.Nombre?.toUpperCase() || '';
      const nameB = b.ItemId?.Nombre?.toUpperCase() || '';
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return result;
  }, [equiposRaw, searchTerm, statusFilter, sedeFilter, servicioFilter, sortOrder]);

  // Paginación manual en cliente
  const paginatedEquipos = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAndSortedEquipos.slice(startIndex, endIndex);
  }, [filteredAndSortedEquipos, page, limit]);

  const totalPages = Math.ceil(filteredAndSortedEquipos.length / limit);
  const totalEquipos = filteredAndSortedEquipos.length;

  // Event handlers optimizados con useCallback
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as 'list' | 'create' | 'bulk');
  }, []);

  const handleEquipoCreated = useCallback(() => {
    setActiveTab('list');
    setPage(1); // Reset a página 1
    refetch();
  }, [refetch]);

  const handleBulkUploadSuccess = useCallback(() => {
    setActiveTab('list');
    setPage(1); // Reset a página 1
    refetch();
  }, [refetch]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setSedeFilter('');
    setServicioFilter('');
    setSortOrder('asc');
    setPage(1); // Reset a página 1 al limpiar filtros
  }, []);

  // Early return para loading state
  if (isLoading && !equiposRaw.length) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando equipos...</span>
        </Spinner>
      </div>
    );
  }

  // Mostrar error en el JSX pero permitir crear equipos

  return (
    <div className="p-4">
      {/* String(error) && (
        <Alert variant="danger" className="mb-3">
          Error al cargar los equipos del cliente. Puedes crear nuevos equipos.
        </Alert>
      )*/}
      
      {/* Navegación por tabs */}
      <Nav variant="pills" className="mb-4 d-flex align-items-center">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'list'} 
            onClick={() => handleTabChange('list')}
          >
            Lista de Equipos ({equiposRaw.length})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'create'} 
            onClick={() => handleTabChange('create')}
          >
            Crear Equipo
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'bulk'} 
            onClick={() => handleTabChange('bulk')}
          >
            Carga Masiva
          </Nav.Link>
        </Nav.Item>
        {equiposRaw.length > 0 && (
          <Nav.Item className="ms-auto d-flex gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleImprimirCronograma}
              disabled={loadingCronograma}
            >
              {loadingCronograma ? (
                <><Spinner as="span" animation="border" size="sm" className="me-1" />Generando...</>
              ) : (
                'Cronograma PDF'
              )}
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => setShowDownloadModal(true)}
            >
              Descargar Inventario
            </Button>
          </Nav.Item>
        )}
      </Nav>

      {/* Contenido según tab activo */}
      {activeTab === 'list' && (
        <>
          {/* Filtros y búsqueda */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Buscar equipos</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por nombre, marca, modelo, serie, inventario..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1); // Reset a página 1 al buscar
                      }}
                    />
                  </Form.Group>
                </Col>
                {/*<Col md={2}>
                  <Form.Group>
                    <Form.Label>Estado</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Todos los estados</option>
                      <option value="OPERATIVO">Operativo</option>
                      <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                      <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
                      <option value="DADO_DE_BAJA">Dado de Baja</option>
                    </Form.Select>
                  </Form.Group>
                </Col>*/}
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Sede</Form.Label>
                    <Select
                      options={sedeOptions}
                      value={sedeOptions.find(opt => opt.value === sedeFilter) || null}
                      onChange={(selected) => {
                        setSedeFilter(selected?.value || '');
                        setPage(1);
                      }}
                      placeholder="Todas las sedes"
                      isSearchable
                      isClearable
                      noOptionsMessage={() => 'No hay sedes'}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Servicio</Form.Label>
                    <Select
                      options={servicioOptions}
                      value={servicioOptions.find(opt => opt.value === servicioFilter) || null}
                      onChange={(selected) => {
                        setServicioFilter(selected?.value || '');
                        setPage(1);
                      }}
                      placeholder="Todos los servicios"
                      isSearchable
                      isClearable
                      noOptionsMessage={() => 'No hay servicios'}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Ordenar por</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                      </InputGroup.Text>
                      <Form.Select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      >
                        <option value="asc">A-Z (Ascendente)</option>
                        <option value="desc">Z-A (Descendente)</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="w-100"
                  >
                    Limpiar Filtros
                  </Button>
                </Col>
              </Row>
              
              {/* Información de resultados */}
              <Row className="mt-3">
                <Col>
                  <small className="text-muted">
                    Mostrando {paginatedEquipos.length} de {totalEquipos} equipos
                    {(searchTerm || statusFilter || sedeFilter || servicioFilter) && ' (filtrados de ' + equiposRaw.length + ' totales)'}
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Lista de equipos */}
          {paginatedEquipos.length === 0 ? (
            <Alert variant="info" className="text-center">
              {equiposRaw.length === 0 ? (
                <>
                  <h6>No hay equipos registrados</h6>
                  <p className="mb-3">Agrega el primer equipo para este cliente.</p>
                </>
              ) : (
                <>
                  <h6>No se encontraron equipos</h6>
                  <p className="mb-3">No hay equipos que coincidan con los filtros aplicados.</p>
                </>
              )}
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="primary" onClick={() => setActiveTab('create')}>
                  Crear Equipo
                </Button>
                <Button variant="outline-primary" onClick={() => setActiveTab('bulk')}>
                  Carga Masiva
                </Button>
              </div>
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>index</th>
                    <th>Equipo</th>
                    <th>Marca/Modelo</th>
                    <th>Serie/Activo</th>
                    <th>Servicio</th>
                    <th>Sede</th>
                    <th>Estado</th>
                    <th>Cronograma</th> {/* Meses en los que le toca mantenimiento */}
                    <th>Último Mtto</th>
                    <th className="text-center" style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEquipos.map((equipo, index) => (
                    <tr key={equipo._id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <div 
                          onClick={() => navigate(`/hv-equipo/${equipo?._id}`)}
                          style={{ cursor: 'pointer' }}
                          >
                          <strong>{equipo?.ItemId?.Nombre || 'N/A'}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{equipo.Marca || 'N/A'}</div>
                          {equipo.Modelo && (
                            <div className="text-muted small">{equipo.Modelo}</div>
                          )}
                        </div>
                      </td>
                      <td>{equipo.Serie || 'N/A'}
                          <div className="text-muted small">{equipo.Inventario}</div>
                      </td>
                      <td>{equipo.Servicio?.nombre || 'N/A'}
                        <div className="text-muted small">{equipo.Ubicacion}</div>
                      </td>
                      <td>{equipo.SedeId?.nombreSede || 'N/A'}</td>
                      <td>
                        <Badge bg={getStatusColor(equipo.Estado)}>
                          {equipo.Estado || 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark">
                          {equipo.mesesMtto?.join(', ').toUpperCase() || 'Sin cronograma'}
                        </Badge>
                      </td>
                      
                      <td>
                        {equipo.UltimoMtto ? (
                          <small>
                            {new Date(equipo.UltimoMtto).toLocaleDateString('es-ES')}
                          </small>
                        ) : (
                          <span className="text-muted">Sin registro</span>
                        )}
                      </td>
                      <td>
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Acciones
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item>
                              Ver detalle
                            </Dropdown.Item>
                            <Dropdown.Item>
                              Editar
                            </Dropdown.Item>
                            <Dropdown.Item>
                              Historial
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger">
                              Eliminar
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <AppPagination
                page={page}
                pages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'create' && (
        <EquipoForm
          customerId={customerId}
          sedes={sedes}
          servicios={servicios}
          onSuccess={handleEquipoCreated}
          onCancel={() => setActiveTab('list')}
        />
      )}

      {activeTab === 'bulk' && (
        <EquipoBulkUpload
          customerId={customerId}
          sedes={sedes}
          servicios={servicios}
          onSuccess={handleEquipoCreated}
          onCancel={() => setActiveTab('list')}
        />
      )}

      <DownloadInventarioModal
        show={showDownloadModal}
        customerId={customerId}
        onHide={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

// Función auxiliar para colores de estado
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'OPERATIVO': return 'success';
    case 'EN_MANTENIMIENTO': return 'warning';
    case 'FUERA_DE_SERVICIO': return 'danger';
    case 'DADO_DE_BAJA': return 'secondary';
    default: return 'secondary';
  }
};

export default CustomerEquiposSection;