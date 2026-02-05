import React, { useState, useMemo } from 'react';
import { Modal, Tab, Nav, Button, Alert, Spinner, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FaPlus, FaTimes, FaCheck, FaSearch, FaFilter } from 'react-icons/fa';
import EquipoForm from '@/components/equipos/EquipoForm';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { api } from '@/services/api';

interface AddEquipoToOtModalProps {
  show: boolean;
  onHide: () => void;
  otId: string;
  clienteId: string;
  onSuccess?: () => void;
}

const AddEquipoToOtModal: React.FC<AddEquipoToOtModalProps> = ({
  show,
  onHide,
  otId,
  clienteId,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<string>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEquipos, setSelectedEquipos] = useState<string[]>([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [filterSerie, setFilterSerie] = useState('');

  // Obtener equipos del cliente
  const { data: equiposResponse, isLoading: loadingEquipos } = useEquipoItems({ 
    ClienteId: clienteId,
    limit: 1000 // Límite aumentado para traer todos los equipos del cliente
  });

  // Obtener sedes y servicios del cliente
  const { data: sedesData } = useSedesByCustomer(clienteId);
  const { data: serviciosData } = useServiciosByCustomer(clienteId);

  const equipos = equiposResponse?.data || [];
  const sedes = sedesData?.data || [];
  const servicios = serviciosData?.data || [];

  // Filtrar equipos según los criterios de búsqueda
  const filteredEquipos = useMemo(() => {
    return equipos.filter((equipo) => {
      const matchesSearch = !searchTerm || 
        (equipo.ItemId?.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipo.Marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipo.Modelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipo.Serie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipo.Inventario || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarca = !filterMarca || 
        (equipo.Marca || '').toLowerCase().includes(filterMarca.toLowerCase());

      const matchesModelo = !filterModelo || 
        (equipo.Modelo || '').toLowerCase().includes(filterModelo.toLowerCase());

      const matchesSerie = !filterSerie || 
        (equipo.Serie || '').toLowerCase().includes(filterSerie.toLowerCase());

      return matchesSearch && matchesMarca && matchesModelo && matchesSerie;
    });
  }, [equipos, searchTerm, filterMarca, filterModelo, filterSerie]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterModelo('');
    setFilterSerie('');
  };

  const handleCreateNew = async () => {
    setLoading(true);
    setError(null);

    try {
      // El EquipoForm ya crea el equipo internamente
      // Simplemente llamamos onSuccess para refrescar datos
      if (onSuccess) {
        onSuccess();
      }
      onHide();
      setActiveTab('new');
    } catch (err: any) {
      console.error('Error creando equipo en OT:', err);
      setError(err.response?.data?.message || 'Error al agregar el equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExisting = async () => {
    if (selectedEquipos.length === 0) {
      setError('Debe seleccionar al menos un equipo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Agregar equipos existentes a la OT
      const response = await api.post(`/ots/${otId}/equipos`, {
        equipos: selectedEquipos.map(equipoId => ({ equipoId })),
        createReport: true
      });

      if (response.data.success) {
      handleClearFilters();
        if (onSuccess) {
          onSuccess();
        }
        onHide();
        setSelectedEquipos([]);
        setActiveTab('new');
      }
    } catch (err: any) {
      console.error('Error agregando equipos a OT:', err);
      setError(err.response?.data?.message || 'Error al agregar los equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEquipo = (equipoId: string) => {
    setSelectedEquipos(prev => {
      if (prev.includes(equipoId)) {
        return prev.filter(id => id !== equipoId);
      } else {
        return [...prev, equipoId];
      }
    });
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSelectedEquipos([]);
      setActiveTab('new');
      onHide();
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="xl"
      backdrop={loading ? 'static' : true}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>
          <FaPlus className="me-2" />
          Agregar Equipos a la OT
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'new')}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="new">
                <FaPlus className="me-1" />
                Crear Equipo Nuevo
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="existing">
                <FaCheck className="me-1" />
                Seleccionar Equipos Existentes
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            {/* Tab: Crear Equipo Nuevo */}
            <Tab.Pane eventKey="new">
              <div className="p-3">
                <Alert variant="info">
                  <strong>Crear un equipo nuevo</strong>
                  <p className="mb-0 small">
                    Complete el formulario para crear un nuevo equipo. Este equipo se agregará automáticamente a la OT.
                  </p>
                </Alert>

                {(sedes.length === 0 || servicios.length === 0) ? (
                  <Alert variant="warning">
                    <Spinner size="sm" className="me-2" />
                    Cargando información del cliente...
                  </Alert>
                ) : (
                  <EquipoForm
                    customerId={clienteId}
                    sedes={sedes}
                    servicios={servicios}
                    onSuccess={handleCreateNew}
                    onCancel={handleClose}
                  />
                )}
              </div>
            </Tab.Pane>

            {/* Tab: Seleccionar Equipos Existentes */}
            <Tab.Pane eventKey="existing">
              <div className="p-3">
                <Alert variant="info">
                  <strong>Seleccionar equipos existentes</strong>
                  <p className="mb-0 small">
                    Seleccione uno o más equipos del cliente para agregarlos a esta OT.
                  </p>
                </Alert>

                {loadingEquipos ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2 text-muted">Cargando equipos...</p>
                  </div>
                ) : equipos.length === 0 ? (
                  <Alert variant="warning">
                    No hay equipos disponibles para este cliente.
                  </Alert>
                ) : (
                  <>{/* Filtros de Búsqueda */}
                    <div className="mb-4 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">
                          <FaFilter className="me-2" />
                          Filtros de Búsqueda
                        </h6>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={handleClearFilters}
                          className="text-decoration-none"
                        >
                          Limpiar filtros
                        </Button>
                      </div>

                      <Row className="g-3">
                        <Col md={12}>
                          <InputGroup>
                            <InputGroup.Text>
                              <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              placeholder="Búsqueda general (nombre, marca, modelo, serie, inventario...)"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            placeholder="Filtrar por marca..."
                            value={filterMarca}
                            onChange={(e) => setFilterMarca(e.target.value)}
                          />
                          <Form.Text className="text-muted">Marca</Form.Text>
                        </Col>
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            placeholder="Filtrar por modelo..."
                            value={filterModelo}
                            onChange={(e) => setFilterModelo(e.target.value)}
                          />
                          <Form.Text className="text-muted">Modelo</Form.Text>
                        </Col>
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            placeholder="Filtrar por serie..."
                            value={filterSerie}
                            onChange={(e) => setFilterSerie(e.target.value)}
                          />
                          <Form.Text className="text-muted">Serie</Form.Text>
                        </Col>
                      </Row>

                      <div className="mt-2">
                        <small className="text-muted">
                          Mostrando {filteredEquipos.length} de {equipos.length} equipos
                        </small>
                      </div>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <strong>{selectedEquipos.length}</strong> equipo(s) seleccionado(s)
                      </small>
                      {selectedEquipos.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setSelectedEquipos([])}
                          className="text-decoration-none"
                        >
                          Deseleccionar todos
                        </Button>
                      )}
                    </div>

                    {filteredEquipos.length === 0 ? (
                      <Alert variant="warning" className="mt-3">
                        No se encontraron equipos con los filtros aplicados.
                      </Alert>
                    ) : (
                      <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredEquipos.map((equipo) => (
                          <label
                            key={equipo._id}
                            className={`list-group-item list-group-item-action ${
                              selectedEquipos.includes(equipo._id!) ? 'active' : ''
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center">
                              <input
                                type="checkbox"
                                className="form-check-input me-3"
                                checked={selectedEquipos.includes(equipo._id!)}
                                onChange={() => handleToggleEquipo(equipo._id!)}
                                style={{ cursor: 'pointer' }}
                              />
                              <div className="flex-grow-1">
                                <div className="fw-bold">
                                  {equipo.ItemId?.Nombre || 'Sin nombre'}
                                </div>
                                <small className={selectedEquipos.includes(equipo._id!) ? 'text-white-50' : 'text-muted'}>
                                  <span className="me-3">
                                    <strong>Marca:</strong> {equipo.Marca || 'N/A'}
                                  </span>
                                  <span className="me-3">
                                    <strong>Modelo:</strong> {equipo.Modelo || 'N/A'}
                                  </span>
                                  <span className="me-3">
                                    <strong>Serie:</strong> {equipo.Serie || 'N/A'}
                                  </span>
                                  {equipo.Inventario && (
                                    <span>
                                      <strong>Inv:</strong> {equipo.Inventario}
                                    </span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                      <Button 
                        variant="secondary" 
                        onClick={handleClose}
                        disabled={loading}
                      >
                        <FaTimes className="me-1" />
                        Cancelar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleAddExisting}
                        disabled={loading || selectedEquipos.length === 0}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-1" />
                            Agregando...
                          </>
                        ) : (
                          <>
                            <FaCheck className="me-1" />
                            Agregar {selectedEquipos.length > 0 && `(${selectedEquipos.length})`}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>

            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
};

export default AddEquipoToOtModal;
