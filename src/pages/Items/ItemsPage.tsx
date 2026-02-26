import React, { useState, useMemo } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert, Table, Form, Dropdown, Badge, InputGroup } from 'react-bootstrap';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { useItems, useDeleteItem } from '@/hooks/useItems';
import Pagination from '@/components/common/Pagination';
import { useNavigate } from 'react-router-dom';

const ItemsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { data, isLoading, error } = useItems({ page, limit });
  const deleteMutation = useDeleteItem();
  const navigate = useNavigate();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar eliminar item?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const itemsRaw = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalItems = data?.pagination?.total ?? 0;

  // Filtrar y ordenar items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...itemsRaw];

    // Filtrar por búsqueda (nombre u observación)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.Nombre?.toLowerCase().includes(query) ||
        item.Observacion?.toLowerCase().includes(query)
      );
    }

    // Ordenar por nombre
    result.sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return result;
  }, [itemsRaw, searchTerm, sortOrder]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset a página 1
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

      {/* Filtros y búsqueda */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
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
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
              <option value={200}>200 items</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Contador de resultados */}
      <Row className="mb-3">
        <Col>
          <small className="text-muted">
            Mostrando {filteredAndSortedItems.length} de {totalItems} items totales
            {searchTerm && ' (filtrados)'}
          </small>
        </Col>
      </Row>

      {/* Controles de paginación */}
      <Row className="mb-3" style={{ display: 'none' }}>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Items por página</Form.Label>
            <Form.Select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              style={{ maxWidth: 200 }}
            >
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
              <option value={200}>200 items</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex justify-content-end align-items-end">
          <Badge bg="info" className="fs-6">
            {totalItems} item{totalItems !== 1 ? 's' : ''} total{totalItems !== 1 ? 'es' : ''}
          </Badge>
        </Col>
      </Row>

      {isLoading ? (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">Error cargando items.</Alert>
      ) : (
        <Card className="tt-card">
          <Card.Body className="p-0">
            {filteredAndSortedItems.length === 0 ? (
              <Alert variant="info" className="m-4 text-center">
                {itemsRaw.length === 0 ? (
                  <>
                    <h5>No hay items disponibles</h5>
                    <p className="mb-3">Crea tu primer item para comenzar.</p>
                    <Button variant="primary" onClick={() => navigate('/items/new')}>
                      Crear Item
                    </Button>
                  </>
                ) : (
                  <>
                    <h5>No se encontraron items</h5>
                    <p className="mb-0">No hay items que coincidan con "{searchTerm}"</p>
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
                      {filteredAndSortedItems.map((item: any) => (
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
                            {item.ProtocoloId?.nombre || (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>{item.Iva}%</td>
                          <td>
                            <Badge bg={item.IvaIncluido ? 'success' : 'secondary'}>
                              {item.IvaIncluido ? 'Sí' : 'No'}
                            </Badge>
                          </td>
                          <td>
                            ${item.Precio?.toLocaleString('es-CO') || '0'}
                          </td>
                          <td style={{ position: 'relative' }}>
                            <Dropdown align="end">
                              <Dropdown.Toggle variant="outline-secondary" size="sm">
                                Acciones
                              </Dropdown.Toggle>
                              <Dropdown.Menu
                                renderOnMount
                                popperConfig={{ strategy: 'fixed' }}
                              >
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
                    <Pagination
                      page={page}
                      pages={totalPages}
                      onChange={setPage}
                    />
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
