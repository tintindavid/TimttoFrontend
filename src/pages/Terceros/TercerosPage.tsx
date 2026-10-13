import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Pagination,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaDownload, FaEdit, FaEye, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import { useDebounce } from '@/hooks/useDebounce';
import DataTable from '@/components/common/DataTable';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { customerService } from '@/services/customer.service';
import { Customer, CustomerKind } from '@/types/customer.types';

const PAGE_SIZE = 20;

type SortDirection = 'asc' | 'desc';

interface ThirdPartyListProps {
  kind: CustomerKind;
}

const COPY: Record<CustomerKind, { plural: string; singular: string; create: string; empty: string; filtered: string; deleteConfirm: string }> = {
  customer: {
    plural: 'clientes',
    singular: 'cliente',
    create: 'Crear Cliente',
    empty: 'Aún no hay clientes registrados.',
    filtered: 'Ningún cliente coincide con los filtros.',
    deleteConfirm: '¿Confirma eliminar este cliente?',
  },
  provider: {
    plural: 'proveedores',
    singular: 'proveedor',
    create: 'Nuevo proveedor',
    empty: 'Aún no hay proveedores registrados.',
    filtered: 'Ningún proveedor coincide con los filtros.',
    deleteConfirm: '¿Confirma eliminar este proveedor?',
  },
};

const ThirdPartyList: React.FC<ThirdPartyListProps> = ({ kind }) => {
  const copy = COPY[kind];
  const isProvider = kind === 'provider';
  const navigate = useNavigate();
  const deleteMutation = useDeleteCustomer();

  const [page, setPage] = useState(1);
  const [razonSocialInput, setRazonSocialInput] = useState('');
  const [ciudadInput, setCiudadInput] = useState('');
  const [nitInput, setNitInput] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [exporting, setExporting] = useState(false);

  const debouncedRazonSocial = useDebounce(razonSocialInput, 300);
  const debouncedCiudad = useDebounce(ciudadInput, 300);
  const debouncedNit = useDebounce(nitInput, 300);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      kind,
      razonSocial: debouncedRazonSocial || undefined,
      ciudad: debouncedCiudad || undefined,
      nit: debouncedNit || undefined,
      sortBy: 'Razonsocial',
      order: sortDirection,
    }),
    [kind, page, debouncedRazonSocial, debouncedCiudad, debouncedNit, sortDirection],
  );

  const { data, isLoading, isFetching, error } = useCustomers(queryParams);
  const customers: Customer[] = data?.data || [];
  const pagination = data?.pagination;

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await customerService.exportCSV();
      toast.success('Clientes exportados correctamente');
    } catch (err: any) {
      toast.error(err.message ?? 'Error al exportar clientes');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(copy.deleteConfirm)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleSort = () => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));

  const columns = [
    {
      key: 'organizacion',
      label: 'Organización',
      render: (row: Customer) => (
        <div>
          <div className="fw-semibold">{row.Razonsocial || '—'}</div>
          <small className="text-muted">NIT: {row.Nit || '—'}</small>
        </div>
      ),
    },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      render: (row: Customer) => (
        <div>
          <div>{row.Ciudad || '—'}</div>
          <small className="text-muted">{row.Direccion || 'Sin dirección'}</small>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row: Customer) => row.Email || '—',
    },
    {
      key: 'contacto',
      label: 'Contacto',
      render: (row: Customer) => (
        <div>
          <div>{row.UserContacto || '—'}</div>
          <small className="text-muted">{row.TelContacto || 'Sin teléfono'}</small>
        </div>
      ),
    },
  ];

  const totalPages = Math.max(1, pagination?.pages || 1);
  const hasActiveFilter = Boolean(debouncedRazonSocial || debouncedCiudad || debouncedNit);

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col className="text-end">
          {!isProvider && (
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              {exporting
                ? <><Spinner animation="border" size="sm" className="me-1" /> Exportando...</>
                : <><FaDownload className="me-1" /> Exportar CSV</>}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => navigate(isProvider ? '/terceros/new?kind=provider' : '/terceros/new')}
          >
            <FaPlus className="me-1" /> {copy.create}
          </Button>
        </Col>
      </Row>

      <Row className="g-2 mb-3">
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por razón social..."
              value={razonSocialInput}
              onChange={(event) => { setRazonSocialInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por ciudad..."
              value={ciudadInput}
              onChange={(event) => { setCiudadInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por NIT..."
              value={nitInput}
              onChange={(event) => { setNitInput(event.target.value); setPage(1); }}
              inputMode="numeric"
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Button variant="outline-secondary" onClick={toggleSort} className="w-100">
            Ordenar por organización {sortDirection === 'asc' ? <FaArrowUp className="ms-1" /> : <FaArrowDown className="ms-1" />}
          </Button>
        </Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>}
      {Boolean(error) && <Alert variant="danger">Error al cargar {copy.plural}.</Alert>}

      {data && (
        <>
          <Card className="tt-card mb-3 position-relative">
            {isFetching && !isLoading && (
              <div className="position-absolute top-0 end-0 m-2">
                <Spinner size="sm" animation="border" variant="secondary" />
              </div>
            )}
            <Card.Body>
              <DataTable
                data={customers}
                columns={columns}
                actions={(row: Customer) => (
                  <div className="d-flex gap-1">
                    <Button size="sm" variant="outline-primary" onClick={() => navigate(`/terceros/${row._id}`)} title="Ver">
                      <FaEye />
                    </Button>
                    <Button size="sm" variant="outline-warning" onClick={() => navigate(`/terceros/${row._id}/edit`)} title="Editar">
                      <FaEdit />
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => row._id && handleDelete(row._id)} title="Eliminar">
                      <FaTrash />
                    </Button>
                  </div>
                )}
              />
              {customers.length === 0 && !isLoading && (
                <p className="text-center text-muted my-3 mb-0">
                  {hasActiveFilter ? copy.filtered : copy.empty}
                </p>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {customers.length} de {pagination?.total ?? customers.length} {copy.plural}
            </small>
            {totalPages > 1 && (
              <Pagination className="mb-0">
                <Pagination.Prev disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Pagination.Item
                    key={pageNumber}
                    active={pageNumber === page}
                    onClick={() => setPage(pageNumber)}
                  >
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
        </>
      )}
    </>
  );
};

const TercerosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: CustomerKind = searchParams.get('tab') === 'provider' ? 'provider' : 'customer';

  const handleSelect = (key: string | null) => {
    setSearchParams(key === 'provider' ? { tab: 'provider' } : {}, { replace: true });
  };

  return (
    <Container fluid>
      <div className="mb-3">
        <h1>Terceros</h1>
        <p className="text-muted mb-0">Gestión de clientes y proveedores del tenant</p>
      </div>
      <Tabs
        id="terceros-tabs"
        activeKey={activeTab}
        onSelect={handleSelect}
        className="mb-3"
        mountOnEnter
        unmountOnExit
      >
        <Tab eventKey="customer" title="Clientes">
          <ThirdPartyList kind="customer" />
        </Tab>
        <Tab eventKey="provider" title="Proveedores">
          <ThirdPartyList kind="provider" />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default TercerosPage;
