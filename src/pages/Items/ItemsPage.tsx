import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert, Table, Form, Dropdown, Badge, InputGroup } from 'react-bootstrap';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { useItems, useDeleteItem } from '@/hooks/useItems';
import { useDebounce } from '@/hooks/useDebounce';
import Pagination from '@/components/common/Pagination';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];
type SortDirection = 'asc' | 'desc';

/**
 * Server-side listing (fix-listing-search-serverside):
 * search + sort + pagination all travel as query params, so the input
 * hits every record in the DB instead of only the visible page.
 */
const ItemsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [sortOrder, setSortOrder] = useState<SortDirection>('asc');
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(searchInput, 300);

  // Reset page whenever the query params that produce a different result-set change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortOrder, limit]);

  const { data, isLoading, isFetching, error } = useItems({
    page,
    limit,
    search: debouncedSearch || undefined,
    sortBy: 'Nombre',
    order: sortOrder,
  });

  const deleteMutation = useDeleteItem();

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('¿Confirmar eliminar item?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const items = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalItems = data?.pagination?.total ?? 0;

  const handleLimitChange = (newLimit: number): void => {
    setLimit(newLimit);
  };

  return (
    <Container>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Items</h1>
          <p className="text-muted">Gestión de items vinculados a protocolos</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" size="lg" onClick={() => navigate('/items/new')}>
            + Crear Item
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={5}>
          <Form.Group>
            <Form.Label>Buscar items</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre u observación..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {isFetching && (
                <InputGroup.Text>
                  <Spinner size="sm" animation="border" />
                </InputGroup.Text>
              )}
            </InputGroup>
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
                onChange={(e) => setSortOrder(e.target.value as SortDirection)}
              >
                <option value="asc">A-Z (Ascendente)</option>
                <option value="desc">Z-A (Descendente)</option>
              </Form.Select>
            </InputGroup>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Form.Group className="w-100">
            <Form.Label>Items por página</Form.Label>
            <Form.Select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} items
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <small className="text-muted">
            Mostrando {items.length} de {totalItems} items totales
            {debouncedSearch && ' (filtrados)'}
          </small>
        </Col>
      </Row>

      {isLoading && !data ? (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">Error cargando items.</Alert>
      ) : (
        <Card className="tt-card">
          <Card.Body className="p-0">
            {items.length === 0 ? (
              <Alert variant="info" className="m-4 text-center">
                {debouncedSearch ? (
                  <>
                    <h5>Ningún item coincide con la búsqueda</h5>
                    <p className="mb-0">No hay items que coincidan con "{debouncedSearch}".</p>
                  </>
                ) : (
                  <>
                    <h5>Aún no hay items configurados</h5>
                    <p className="mb-3">Crea tu primer item para comenzar.</p>
                    <Button variant="primary" onClick={() => navigate('/items/new')}>
                      Crear Item
                    </Button>
                  </>
                )}
              </Alert>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Observación</th>
                        <th>Protocolo</th>
                        <th>IVA</th>
                        <th>IVA Incluido</th>
                        <th>Precio</th>
                        <th className="text-center" style={{ width: 200 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={item._id}>
                          <td><strong>{item.Nombre}</strong></td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: 250 }}>
                              {item.Observacion || (
                                <span className="text-muted fst-italic">Sin observación</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {item.ProtocoloId?.nombre || <span className="text-muted">N/A</span>}
                          </td>
                          <td>{item.Iva}%</td>
                          <td>
                            <Badge bg={item.IvaIncluido ? 'success' : 'secondary'}>
                              {item.IvaIncluido ? 'Sí' : 'No'}
                            </Badge>
                          </td>
                          <td>${item.Precio?.toLocaleString('es-CO') || '0'}</td>
                          <td style={{ position: 'relative' }}>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="outline-secondary" size="sm">
                                Acciones
                              </Dropdown.Toggle>
                              <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                                <Dropdown.Item onClick={() => navigate(`/items/${item._id}`)}>
                                  Ver detalle
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => navigate(`/items/${item._id}/edit`)}>
                                  Editar
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => handleDelete(item._id)}
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

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center p-3 border-top">
                    <Pagination page={page} pages={totalPages} onChange={setPage} />
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ItemsPage;
