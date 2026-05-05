import React, { useState, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Alert,
  Table,
  Badge,
  Dropdown,
  Form,
  InputGroup,
} from 'react-bootstrap';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useActividades, useSearchActividades, useDeleteActividad } from '@/hooks/useActividades';
import { useDebounce } from '@/hooks/useDebounce';
import { ActividadMtto } from '@/types/actividad.types';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';

const ActividadesPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadMtto | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);
  const isSearchMode = debouncedSearch.trim().length > 0;

  const listQuery = useActividades({ page, limit: 10 });
  const searchQuery = useSearchActividades(debouncedSearch);
  const deleteMutation = useDeleteActividad();

  const actividades = isSearchMode
    ? (searchQuery.data?.data ?? [])
    : (listQuery.data?.data ?? []);
  const totalPages = isSearchMode ? 1 : (listQuery.data?.pagination?.pages ?? 1);
  const isLoading = isSearchMode ? searchQuery.isFetching : listQuery.isLoading;
  const searchError = isSearchMode && searchQuery.error
    ? ((searchQuery.error as any)?.response?.data?.message ?? 'Error al buscar actividades.')
    : null;

  const sortedActividades = useMemo(() => {
    return [...actividades].sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }, [actividades, sortOrder]);

  const handleDelete = async () => {
    if (!selectedActividad?._id) return;
    try {
      await deleteMutation.mutateAsync(selectedActividad._id);
      setShowDeleteModal(false);
      setSelectedActividad(null);
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
    }
  };

  const openDeleteModal = (actividad: ActividadMtto) => {
    setSelectedActividad(actividad);
    setShowDeleteModal(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (listQuery.error && !isSearchMode) {
    return <Alert variant="danger">Error al cargar actividades. Intenta nuevamente.</Alert>;
  }

  return (
    <Container>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Actividades</h1>
          <p className="text-muted">Lista de actividades de mantenimiento</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" size="lg" onClick={() => navigate('/actividades/new')}>
            + Crear Actividad
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              {isLoading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
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
        </Col>
        <Col md={3} className="d-flex justify-content-end align-items-center">
          <Badge bg="info" className="fs-6">
            {sortedActividades.length} actividad{sortedActividades.length !== 1 ? 'es' : ''}
          </Badge>
        </Col>
      </Row>

      {searchError && <Alert variant="danger" className="mb-3">{searchError}</Alert>}

      <Card className="tt-card">
        <Card.Body className="p-0">
          {sortedActividades.length === 0 && !isLoading ? (
            <div className="text-center py-5">
              <Alert variant="info" className="mx-4">
                {isSearchMode ? (
                  <>
                    <h5>No se encontraron actividades</h5>
                    <p className="mb-0">No hay actividades que coincidan con "{debouncedSearch}"</p>
                  </>
                ) : (
                  <>
                    <h5>No hay actividades disponibles</h5>
                    <p className="mb-3">Crea tu primera actividad para comenzar.</p>
                    <Button variant="primary" onClick={() => navigate('/actividades/new')}>
                      Crear Actividad
                    </Button>
                  </>
                )}
              </Alert>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Obligatoria</th>
                      <th className="text-center" style={{ width: 120 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedActividades.map((actividad) => (
                      <tr key={actividad._id}>
                        <td><strong>{actividad.Nombre}</strong></td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: 260 }}>
                            {actividad.Descripcion ?? (
                              <span className="text-muted fst-italic">Sin descripción</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={actividad.EsObligatoria ? 'success' : 'secondary'}>
                            {actividad.EsObligatoria ? 'Sí' : 'No'}
                          </Badge>
                        </td>
                        <td>
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                              Acciones
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                              <Dropdown.Item onClick={() => navigate(`/actividades/${actividad._id}/edit`)}>
                                Editar
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => openDeleteModal(actividad)}
                              >
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

              {!isSearchMode && totalPages > 1 && (
                <div className="d-flex justify-content-center p-3 border-top">
                  <Pagination page={page} pages={totalPages} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={showDeleteModal}
        title="Confirmar eliminación"
        body={`¿Eliminar la actividad "${selectedActividad?.Nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedActividad(null);
        }}
      />
    </Container>
  );
};

export default ActividadesPage;
