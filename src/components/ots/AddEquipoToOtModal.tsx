import React, { useState, useMemo } from 'react';
import { Modal, Tab, Nav, Button, Alert, Spinner, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { FaPlus, FaTimes, FaCheck, FaSearch, FaFilter } from 'react-icons/fa';
import EquipoForm from '@/components/equipos/EquipoForm';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { api } from '@/services/api';
import { EquipoItem } from '@/types/equipoItem.types';

interface AddEquipoToOtModalProps {
  show: boolean;
  onHide: () => void;
  otId: string;
  clienteId: string;
  /**
   * IDs of equipos already attached to the OT (non-cancelled reports).
   * Rendered as disabled rows with a "Ya en la OT" badge; excluded from
   * selection state and from the check-all toggle.
   */
  existingEquipoIds?: string[];
  onSuccess?: () => void;
}

const AddEquipoToOtModal: React.FC<AddEquipoToOtModalProps> = ({
  show,
  onHide,
  otId,
  clienteId,
  existingEquipoIds = [],
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
  const [filterSedeId, setFilterSedeId] = useState('');
  const [filterServicioId, setFilterServicioId] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');

  // Obtener equipos del cliente
  const { data: equiposResponse, isLoading: loadingEquipos } = useEquipoItems({
    ClienteId: clienteId,
    limit: 1000
  });

  // Obtener sedes y servicios del cliente
  const { data: sedesData } = useSedesByCustomer(clienteId);
  const { data: serviciosData } = useServiciosByCustomer(clienteId);

  const equipos = equiposResponse?.data || [];
  const sedes = sedesData?.data || [];
  const servicios = serviciosData?.data || [];

  const existingSet = useMemo(() => new Set(existingEquipoIds || []), [existingEquipoIds]);

  // Filtrar equipos según los criterios de búsqueda
  const filteredEquipos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const marca = filterMarca.trim().toLowerCase();
    const modelo = filterModelo.trim().toLowerCase();
    const serie = filterSerie.trim().toLowerCase();
    const ubi = filterUbicacion.trim().toLowerCase();

    return equipos.filter((equipo: any) => {
      const matchesSearch = !term ||
        (equipo.ItemId?.Nombre || '').toLowerCase().includes(term) ||
        (equipo.Marca || '').toLowerCase().includes(term) ||
        (equipo.Modelo || '').toLowerCase().includes(term) ||
        (equipo.Serie || '').toLowerCase().includes(term) ||
        (equipo.Inventario || '').toLowerCase().includes(term);

      const matchesMarca = !marca || (equipo.Marca || '').toLowerCase().includes(marca);
      const matchesModelo = !modelo || (equipo.Modelo || '').toLowerCase().includes(modelo);
      const matchesSerie = !serie || (equipo.Serie || '').toLowerCase().includes(serie);
      const matchesUbi = !ubi || (equipo.Ubicacion || '').toLowerCase().includes(ubi);

      const matchesSede = !filterSedeId || String(equipo.SedeId?._id || '') === filterSedeId;
      const matchesServicio = !filterServicioId || String(equipo.Servicio?._id || '') === filterServicioId;

      return matchesSearch && matchesMarca && matchesModelo && matchesSerie
        && matchesUbi && matchesSede && matchesServicio;
    });
  }, [equipos, searchTerm, filterMarca, filterModelo, filterSerie, filterUbicacion, filterSedeId, filterServicioId]);

  // Equipos filtrados que se pueden seleccionar (excluye los ya en la OT).
  const selectableFilteredIds = useMemo(
    () => filteredEquipos
      .map((e: any) => e._id as string)
      .filter((id) => !existingSet.has(id)),
    [filteredEquipos, existingSet]
  );

  // ¿Todos los seleccionables filtrados están ya seleccionados?
  const allSelectableFilteredSelected = useMemo(() => {
    if (selectableFilteredIds.length === 0) return false;
    return selectableFilteredIds.every((id) => selectedEquipos.includes(id));
  }, [selectableFilteredIds, selectedEquipos]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterMarca('');
    setFilterModelo('');
    setFilterSerie('');
    setFilterSedeId('');
    setFilterServicioId('');
    setFilterUbicacion('');
  };

  /**
   * Toggle-all para lo filtrado visible (excluye equipos ya en la OT):
   * - Si todos los seleccionables filtrados están ya en `selectedEquipos`, los quita.
   * - Si no, los agrega (union), preservando cualquier selección previa fuera del filtro.
   */
  const handleToggleAllFiltered = () => {
    if (selectableFilteredIds.length === 0) return;
    setSelectedEquipos((prev) => {
      if (allSelectableFilteredSelected) {
        const toRemove = new Set(selectableFilteredIds);
        return prev.filter((id) => !toRemove.has(id));
      }
      const merged = new Set(prev);
      selectableFilteredIds.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
  };

  const handleCreateNew = async (created?: { _id?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const newEquipoId = created?._id;
      if (!newEquipoId) throw new Error('No se recibió el ID del equipo recién creado.');

      const response = await api.post(`/ots/${otId}/equipos`, {
        equipos: [{ equipoId: newEquipoId }],
        createReport: true,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No fue posible adjuntar el equipo a la OT.');
      }

      if (onSuccess) onSuccess();
      onHide();
      setActiveTab('new');
    } catch (err: any) {
      console.error('Error creando equipo en OT:', err);
      setError(err.response?.data?.message || err.message || 'Error al agregar el equipo');
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
      const response = await api.post(`/ots/${otId}/equipos`, {
        equipos: selectedEquipos.map(equipoId => ({ equipoId })),
        createReport: true
      });

      if (response.data.success) {
        handleClearFilters();
        if (onSuccess) onSuccess();
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
    if (existingSet.has(equipoId)) return; // no permite tocar los ya-en-OT
    setSelectedEquipos(prev => {
      if (prev.includes(equipoId)) return prev.filter(id => id !== equipoId);
      return [...prev, equipoId];
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

  const existingInFilteredCount = useMemo(
    () => filteredEquipos.reduce((n: number, e: any) => (existingSet.has(e._id) ? n + 1 : n), 0),
    [filteredEquipos, existingSet]
  );

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
                    onUseExisting={(existing: EquipoItem) => handleCreateNew(existing)}
                    onUseExistingLabel="Agregar a la OT"
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
                    Los equipos que ya están en la OT aparecen marcados y no se pueden seleccionar de nuevo.
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
                  <>
                    {/* Filtros de Búsqueda */}
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
                          <Form.Select
                            value={filterSedeId}
                            onChange={(e) => setFilterSedeId(e.target.value)}
                          >
                            <option value="">Todas las sedes</option>
                            {sedes.map((s: any) => (
                              <option key={s._id} value={s._id}>
                                {s.nombreSede || 'Sin nombre'}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">Sede</Form.Text>
                        </Col>
                        <Col md={4}>
                          <Form.Select
                            value={filterServicioId}
                            onChange={(e) => setFilterServicioId(e.target.value)}
                          >
                            <option value="">Todos los servicios</option>
                            {servicios.map((s: any) => (
                              <option key={s._id} value={s._id}>
                                {s.nombre || 'Sin nombre'}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">Servicio</Form.Text>
                        </Col>
                        <Col md={4}>
                          <Form.Control
                            type="text"
                            placeholder="Filtrar por ubicación..."
                            value={filterUbicacion}
                            onChange={(e) => setFilterUbicacion(e.target.value)}
                          />
                          <Form.Text className="text-muted">Ubicación</Form.Text>
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

                      <div className="mt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">
                          Mostrando {filteredEquipos.length} de {equipos.length} equipos
                          {existingInFilteredCount > 0 && (
                            <> · {existingInFilteredCount} ya en la OT</>
                          )}
                        </small>
                      </div>
                    </div>

                    <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <Form.Check
                          type="checkbox"
                          id="check-all-filtered"
                          label={
                            allSelectableFilteredSelected
                              ? `Deseleccionar ${selectableFilteredIds.length} filtrado${selectableFilteredIds.length !== 1 ? 's' : ''}`
                              : `Seleccionar ${selectableFilteredIds.length} filtrado${selectableFilteredIds.length !== 1 ? 's' : ''}`
                          }
                          checked={allSelectableFilteredSelected}
                          onChange={handleToggleAllFiltered}
                          disabled={selectableFilteredIds.length === 0}
                        />
                        <small className="text-muted">
                          <strong>{selectedEquipos.length}</strong> equipo(s) seleccionado(s) en total
                        </small>
                      </div>
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
                        {filteredEquipos.map((equipo: any) => {
                          const isInOt = existingSet.has(equipo._id);
                          const isSelected = selectedEquipos.includes(equipo._id);
                          const rowClasses = [
                            'list-group-item',
                            'list-group-item-action',
                            isInOt ? 'text-muted' : '',
                            !isInOt && isSelected ? 'active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');
                          return (
                            <label
                              key={equipo._id}
                              className={rowClasses}
                              style={{
                                cursor: isInOt ? 'not-allowed' : 'pointer',
                                opacity: isInOt ? 0.65 : 1,
                                background: isInOt ? '#f5f5f5' : undefined,
                              }}
                              title={isInOt ? 'Este equipo ya está en la OT' : undefined}
                            >
                              <div className="d-flex align-items-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input me-3"
                                  checked={isInOt ? true : isSelected}
                                  disabled={isInOt}
                                  onChange={() => handleToggleEquipo(equipo._id)}
                                  style={{ cursor: isInOt ? 'not-allowed' : 'pointer' }}
                                />
                                <div className="flex-grow-1">
                                  <div className="fw-bold d-flex align-items-center gap-2">
                                    {equipo.ItemId?.Nombre || 'Sin nombre'}
                                    {isInOt && (
                                      <Badge bg="secondary" pill>Ya en la OT</Badge>
                                    )}
                                  </div>
                                  <small className={!isInOt && isSelected ? 'text-white-50' : 'text-muted'}>
                                    <span className="me-3"><strong>Marca:</strong> {equipo.Marca || 'N/A'}</span>
                                    <span className="me-3"><strong>Modelo:</strong> {equipo.Modelo || 'N/A'}</span>
                                    <span className="me-3"><strong>Serie:</strong> {equipo.Serie || 'N/A'}</span>
                                    {equipo.Inventario && (
                                      <span className="me-3"><strong>Inv:</strong> {equipo.Inventario}</span>
                                    )}
                                    {equipo.SedeId?.nombreSede && (
                                      <span className="me-3"><strong>Sede:</strong> {equipo.SedeId.nombreSede}</span>
                                    )}
                                    {equipo.Servicio?.nombre && (
                                      <span className="me-3"><strong>Servicio:</strong> {equipo.Servicio.nombre}</span>
                                    )}
                                    {equipo.Ubicacion && (
                                      <span><strong>Ubicación:</strong> {equipo.Ubicacion}</span>
                                    )}
                                  </small>
                                </div>
                              </div>
                            </label>
                          );
                        })}
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
