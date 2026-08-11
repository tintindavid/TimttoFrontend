import React, { useEffect, useState } from 'react';
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Table,
  Badge,
  Dropdown,
  Form,
  InputGroup,
} from 'react-bootstrap';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useProtocols, useDeleteProtocol } from '@/hooks/useProtocols';
import { useDebounce } from '@/hooks/useDebounce';
import { ProtocolMtto } from '@/types/protocol.types';
import ConfirmModal from '@/components/common/ConfirmModal';
import Pagination from '@/components/common/Pagination';

const PAGE_SIZE = 20;
type SortDirection = 'asc' | 'desc';

/**
 * Server-side listing (fix-listing-search-serverside):
 * search + sort + page all travel as query params. Debounced input to avoid
 * a request per keystroke; keepPreviousData on the hook so paging + typing
 * don't flicker.
 */
const ProtocolsPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sortOrder, setSortOrder] = useState<SortDirection>('asc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolMtto | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Reset to page 1 whenever the search term changes (post-debounce).
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortOrder]);

  const { data, isLoading, isFetching, error } = useProtocols({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    sortBy: 'nombre',
    order: sortOrder,
  });

  const deleteMutation = useDeleteProtocol();

  const protocols = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? 0;

  const handleDelete = async (): Promise<void> => {
    if (!selectedProtocol?._id) return;
    try {
      await deleteMutation.mutateAsync(selectedProtocol._id);
      setShowDeleteModal(false);
      setSelectedProtocol(null);
    } catch (err) {
      console.error('Error al eliminar protocolo:', err);
    }
  };

  const openDeleteModal = (protocol: ProtocolMtto): void => {
    setSelectedProtocol(protocol);
    setShowDeleteModal(true);
  };

  if (isLoading && !data) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">Error al cargar protocolos. Intenta nuevamente.</Alert>;
  }

  return (
    <Container>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Protocolos de Mantenimiento</h1>
          <p className="text-muted">Gestión de protocolos de mantenimiento</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" size="lg" onClick={() => navigate('/protocols/new')}>
            + Crear Protocolo
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar protocolos por nombre o descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && (
              <InputGroup.Text>
                <Spinner size="sm" animation="border" />
              </InputGroup.Text>
            )}
          </InputGroup>
        </Col>
        <Col md={4} className="text-md-end mt-2 mt-md-0">
          <Button
            variant="outline-secondary"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            Ordenar A–Z{' '}
            {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
          </Button>
        </Col>
      </Row>

      <Card className="tt-card">
        <Card.Body className="p-0">
          {protocols.length === 0 ? (
            <div className="text-center py-5">
              <Alert variant="info" className="mx-4">
                {debouncedSearch ? (
                  <>
                    <h5>Ningún protocolo coincide con la búsqueda</h5>
                    <p className="mb-0">No hay protocolos que coincidan con "{debouncedSearch}".</p>
                  </>
                ) : (
                  <>
                    <h5>Aún no hay protocolos configurados</h5>
                    <p className="mb-3">Crea tu primer protocolo para comenzar.</p>
                    <Button variant="primary" onClick={() => navigate('/protocols/new')}>
                      Crear Protocolo
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
                      <th>Actividades</th>
                      <th>Creado</th>
                      <th className="text-center" style={{ width: 120 }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {protocols.map((protocol) => (
                      <tr key={protocol._id}>
                        <td>
                          <strong>{protocol.nombre}</strong>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: 220 }}>
                            {protocol.Descripcion ?? (
                              <span className="text-muted fst-italic">Sin descripción</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">{protocol.actividadesMtto?.length ?? 0}</Badge>
                        </td>
                        <td>
                          <small className="text-muted">
                            {protocol.createdAt
                              ? new Date(protocol.createdAt).toLocaleDateString('es-ES')
                              : 'N/A'}
                          </small>
                        </td>
                        <td style={{ position: 'relative' }}>
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                              Acciones
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                              <Dropdown.Item onClick={() => navigate(`/protocols/${protocol._id}`)}>
                                Ver detalle
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => navigate(`/protocols/${protocol._id}/edit`)}
                              >
                                Editar
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => openDeleteModal(protocol)}
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

              <div className="d-flex justify-content-between align-items-center p-3 border-top flex-wrap gap-2">
                <small className="text-muted">
                  Mostrando {protocols.length} de {totalCount} protocolo{totalCount !== 1 ? 's' : ''}
                </small>
                {totalPages > 1 && <Pagination page={page} pages={totalPages} onChange={setPage} />}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={showDeleteModal}
        title="Confirmar eliminación"
        body={`¿Eliminar el protocolo "${selectedProtocol?.nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedProtocol(null);
        }}
      />
    </Container>
  );
};

export default ProtocolsPage;
