import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Pagination,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useDeleteInventarioRepuesto, useInventarioList } from '@/hooks/useInventarioRepuestos';
import InventarioItemModal from '@/components/inventario/InventarioItemModal';
import InventarioMovimientoModal from '@/components/inventario/InventarioMovimientoModal';
import InventarioHistorialModal from '@/components/inventario/InventarioHistorialModal';
import { getApiErrorMessage } from '@/components/inventario/getApiErrorMessage';
import {
  INVENTARIO_TIPO_LABELS,
  type InventarioRepuesto,
  type InventarioTipo,
} from '@/types/inventarioRepuesto.types';

const PAGE_SIZE = 20;
type SortDirection = 'asc' | 'desc';

const InventarioRepuestosPage: React.FC = () => {
  // Basic: catalog only. Advanced: quantities, movements and history.
  const { can } = useTenantCapabilities();
  const advanced = can('usesInventoryAdvanced');

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [tipo, setTipo] = useState<'' | InventarioTipo>('');
  const [stockBajo, setStockBajo] = useState(false);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editing, setEditing] = useState<InventarioRepuesto | null>(null);
  const [movimientoItem, setMovimientoItem] = useState<InventarioRepuesto | null>(null);
  const [historialItem, setHistorialItem] = useState<InventarioRepuesto | null>(null);

  // Debounce the raw input so we don't fire a request per keystroke.
  const debouncedSearch = useDebounce(searchInput, 300);

  // Any change that produces a different result-set must reset to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortDirection, tipo, stockBajo]);

  const { data, isLoading, isFetching, isError } = useInventarioList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch.trim() || undefined,
    sortBy: 'nombre',
    order: sortDirection,
    tipo: tipo || undefined,
    stockBajo: advanced && stockBajo ? true : undefined,
  });
  const deleteMutation = useDeleteInventarioRepuesto();

  const rows = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? rows.length;
  const hasFilters = !!debouncedSearch.trim() || !!tipo || (advanced && stockBajo);

  const openCreate = () => {
    setEditing(null);
    setShowItemModal(true);
  };

  const openEdit = (item: InventarioRepuesto) => {
    setEditing(item);
    setShowItemModal(true);
  };

  const handleDelete = async (item: InventarioRepuesto) => {
    if (!item._id) return;
    if (!window.confirm(`¿Desea eliminar "${item.nombre}" del catálogo?`)) return;
    try {
      await deleteMutation.mutateAsync(item._id);
      toast.success('Ítem eliminado');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Error eliminando ítem'));
    }
  };

  const colSpan = advanced ? 9 : 3;

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="h4 mb-0">Stock</h1>
        </Col>
        <Col className="text-end">
          <Button onClick={openCreate}>Crear ítem</Button>
        </Col>
      </Row>

      <Row className="mb-3 g-2 align-items-center">
        <Col md={advanced ? 5 : 6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              aria-label="Buscar ítems por nombre"
              placeholder={advanced ? 'Buscar ítems por nombre o referencia...' : 'Buscar ítems por nombre...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {isFetching && !isLoading && (
              <InputGroup.Text>
                <Spinner animation="border" size="sm" role="status" aria-label="Actualizando" />
              </InputGroup.Text>
            )}
          </InputGroup>
        </Col>
        <Col md={advanced ? 2 : 3}>
          <Form.Select
            aria-label="Filtrar por tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as '' | InventarioTipo)}
          >
            <option value="">Todos los tipos</option>
            {(Object.keys(INVENTARIO_TIPO_LABELS) as InventarioTipo[]).map((t) => (
              <option key={t} value={t}>
                {INVENTARIO_TIPO_LABELS[t]}
              </option>
            ))}
          </Form.Select>
        </Col>
        {advanced && (
          <Col md={2}>
            <Form.Check
              type="checkbox"
              id="inv-stock-bajo"
              label="Solo stock bajo"
              checked={stockBajo}
              onChange={(e) => setStockBajo(e.target.checked)}
            />
          </Col>
        )}
        <Col md={advanced ? 3 : 3} className="text-md-end">
          <Button
            variant="outline-secondary"
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            Ordenar A–Z {sortDirection === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
          </Button>
        </Col>
      </Row>

      {isError && <Alert variant="danger">No fue posible cargar el catálogo.</Alert>}

      <Card className="tt-card">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                {advanced && (
                  <>
                    <th>Referencia</th>
                    <th>Stock</th>
                    <th>Stock mínimo</th>
                    <th>Unidad</th>
                    <th>Precio</th>
                    <th>Estado</th>
                  </>
                )}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={colSpan} className="text-center">
                    <Spinner animation="border" variant="primary" size="sm" role="status" aria-label="Cargando" />
                  </td>
                </tr>
              )}
              {rows.map((item) => {
                const isLow = advanced && (item.stockActual ?? 0) <= (item.stockMinimo ?? 0) && (item.stockMinimo ?? 0) > 0;
                return (
                  <tr key={item._id} className={isLow ? 'table-warning' : ''}>
                    <td>{item.nombre}</td>
                    <td>{INVENTARIO_TIPO_LABELS[item.tipo] ?? '-'}</td>
                    {advanced && (
                      <>
                        <td>{item.referencia || '-'}</td>
                        <td>{item.stockActual ?? 0}</td>
                        <td>{item.stockMinimo ?? 0}</td>
                        <td>{item.unidad || '-'}</td>
                        <td>{item.precio ?? 0}</td>
                        <td>
                          {isLow ? (
                            <Badge bg="warning" text="dark">
                              Stock bajo
                            </Badge>
                          ) : (
                            <Badge bg="success">OK</Badge>
                          )}
                        </td>
                      </>
                    )}
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {advanced && (
                          <>
                            <Button
                              size="sm"
                              variant="outline-success"
                              aria-label={`Registrar movimiento de ${item.nombre}`}
                              onClick={() => setMovimientoItem(item)}
                            >
                              Movimiento
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              aria-label={`Ver historial de ${item.nombre}`}
                              onClick={() => setHistorialItem(item)}
                            >
                              Historial
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline-primary"
                          aria-label={`Editar ${item.nombre}`}
                          onClick={() => openEdit(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          aria-label={`Eliminar ${item.nombre}`}
                          onClick={() => handleDelete(item)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {!isLoading && !isError && rows.length === 0 && (
            <p className="text-center text-muted my-3 mb-0">
              {hasFilters ? 'Ningún ítem coincide con la búsqueda.' : 'Aún no hay ítems en el catálogo.'}
            </p>
          )}
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <small className="text-muted">
          Mostrando {rows.length} de {totalCount} ítems
        </small>
        {totalPages > 1 && (
          <Pagination className="mb-0">
            <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Pagination.Item key={pageNumber} active={pageNumber === page} onClick={() => setPage(pageNumber)}>
                {pageNumber}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </Pagination>
        )}
      </div>

      <InventarioItemModal
        show={showItemModal}
        onHide={() => setShowItemModal(false)}
        item={editing}
        advanced={advanced}
      />
      {advanced && (
        <>
          <InventarioMovimientoModal
            show={!!movimientoItem}
            onHide={() => setMovimientoItem(null)}
            item={movimientoItem}
          />
          <InventarioHistorialModal
            show={!!historialItem}
            onHide={() => setHistorialItem(null)}
            item={historialItem}
          />
        </>
      )}
    </Container>
  );
};

export default InventarioRepuestosPage;
