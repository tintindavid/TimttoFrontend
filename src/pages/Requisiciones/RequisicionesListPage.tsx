import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Nav,
  Row,
  Spinner,
} from 'react-bootstrap';
import { FaArrowDown, FaArrowUp, FaBook, FaEye, FaPlus, FaSearch } from 'react-icons/fa';
import DataTable from '@/components/common/DataTable';
import AppPagination from '@/components/common/Pagination';
import Can from '@/components/common/Can';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import { useGetRequisiciones } from '@/hooks/useRequisiciones';
import { useGetAreas } from '@/hooks/useAreas';
import { useGetTiposRequisicion } from '@/hooks/useTiposRequisicion';
import { PERMISSIONS } from '@/constants/permissions';
import {
  REQUISICION_ESTADOS,
  REQUISICION_ESTADO_LABELS,
  type Requisicion,
  type RequisicionEstado,
  type RequisicionVista,
} from '@/types/requisicion.types';
import { catalogName, formatDate, formatMoney, userRefName } from '@/utils/requisicion.utils';
import RequisicionEstadoBadge from './components/RequisicionEstadoBadge';
import ReqHelp from './help/ReqHelp';
import GuiaModal from './help/GuiaModal';

const PAGE_SIZE = 20;

type SortDirection = 'asc' | 'desc';

interface Props {
  /** `mias`: requisitions created by the user; `por-aprobar`: the approver inbox. */
  vista: RequisicionVista;
}

const RequisicionesListPage: React.FC<Props> = ({ vista }) => {
  const navigate = useNavigate();
  const canApprove = useHasPermission(PERMISSIONS.REQUISICIONES_APPROVE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [estado, setEstado] = useState<RequisicionEstado | ''>('');
  const [areaId, setAreaId] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showGuia, setShowGuia] = useState(false);

  // Debounce the free-text input so the API isn't hit on every keystroke.
  const debouncedSearch = useDebounce(searchInput, 300);

  // Any change that produces a different result set resets the page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, estado, areaId, tipoId, fechaDesde, fechaHasta, sortDirection, vista]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      vista,
      search: debouncedSearch.trim() || undefined,
      estado: estado || undefined,
      areaId: areaId || undefined,
      tipoRequisicionId: tipoId || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      sortBy: 'createdAt' as const,
      order: sortDirection,
    }),
    [page, vista, debouncedSearch, estado, areaId, tipoId, fechaDesde, fechaHasta, sortDirection]
  );

  const { data, isLoading, isFetching, isError } = useGetRequisiciones(queryParams);
  const { data: areasResponse } = useGetAreas({ limit: 100 });
  const { data: tiposResponse } = useGetTiposRequisicion({ limit: 100 });

  const rows: Requisicion[] = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const totalCount = data?.pagination?.total ?? rows.length;
  const areas = areasResponse?.data ?? [];
  const tipos = tiposResponse?.data ?? [];

  const hasActiveFilter = Boolean(debouncedSearch.trim() || estado || areaId || tipoId || fechaDesde || fechaHasta);

  const columns = [
    { key: 'consecutivo', label: 'Consecutivo', render: (r: Requisicion) => <span className="text-nowrap fw-semibold">{r.consecutivo}</span> },
    { key: 'titulo', label: 'Título' },
    { key: 'area', label: 'Área', render: (r: Requisicion) => catalogName(r.areaId) },
    { key: 'tipo', label: 'Tipo', render: (r: Requisicion) => catalogName(r.tipoRequisicionId) },
    {
      key: 'solicitante',
      label: 'Solicitante',
      render: (r: Requisicion) => userRefName(r.solicitanteId ?? r.creadaPor),
    },
    { key: 'prioridad', label: 'Prioridad' },
    {
      key: 'montoEstimado',
      label: 'Monto estimado',
      render: (r: Requisicion) => <span className="text-nowrap">{formatMoney(r.montoEstimado, r.moneda)}</span>,
    },
    { key: 'estado', label: 'Estado', render: (r: Requisicion) => <RequisicionEstadoBadge estado={r.estado} /> },
    { key: 'createdAt', label: 'Creada', render: (r: Requisicion) => formatDate(r.createdAt) },
  ];

  const emptyMessage = hasActiveFilter
    ? 'Ninguna requisición coincide con los filtros.'
    : vista === 'por-aprobar'
      ? 'No tienes requisiciones pendientes por aprobar.'
      : 'Aún no has creado requisiciones.';

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>
            Requisiciones
            <ReqHelp id={vista === 'por-aprobar' ? 'pagina.porAprobar' : 'pagina.listado'} placement="bottom" />
          </h1>
          <p className="text-muted mb-0">Solicitudes de compra y su flujo de aprobación</p>
        </Col>
        <Col className="text-end d-flex flex-wrap justify-content-end align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => setShowGuia(true)}>
            <FaBook className="me-2" aria-hidden="true" />
            Guía del módulo
          </Button>
          <Can permission={PERMISSIONS.REQUISICIONES_CREATE}>
            <Button variant="primary" onClick={() => navigate('/requisiciones/new')}>
              <FaPlus className="me-2" aria-hidden="true" />
              Nueva requisición
            </Button>
            <ReqHelp id="accion.nueva" placement="bottom" className="ms-0" />
          </Can>
        </Col>
      </Row>

      <Nav variant="tabs" className="mb-3" activeKey={vista}>
        <Nav.Item className="d-flex align-items-center">
          <Nav.Link eventKey="mias" onClick={() => navigate('/requisiciones')}>
            Mis requisiciones
          </Nav.Link>
          <ReqHelp id="pagina.mias" className="ms-0 me-2" />
        </Nav.Item>
        {canApprove && (
          <Nav.Item className="d-flex align-items-center">
            <Nav.Link eventKey="por-aprobar" onClick={() => navigate('/requisiciones/por-aprobar')}>
              Por aprobar
            </Nav.Link>
            <ReqHelp id="pagina.porAprobar" className="ms-0 me-2" />
          </Nav.Item>
        )}
      </Nav>

      <Row className="g-2 mb-3">
        <Col md={4} className="d-flex align-items-center gap-1">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por consecutivo o título..."
              aria-label="Buscar requisiciones"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </InputGroup>
          <ReqHelp id="filtro.busqueda" className="ms-0" />
        </Col>
        <Col md={2} className="d-flex align-items-center gap-1">
          <Form.Select aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value as RequisicionEstado | '')}>
            <option value="">Todos los estados</option>
            {REQUISICION_ESTADOS.map((value) => (
              <option key={value} value={value}>
                {REQUISICION_ESTADO_LABELS[value]}
              </option>
            ))}
          </Form.Select>
          <ReqHelp id="estados.leyenda" className="ms-0" />
        </Col>
        <Col md={3} className="d-flex align-items-center gap-1">
          <Form.Select aria-label="Filtrar por área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.nombre}
              </option>
            ))}
          </Form.Select>
          <ReqHelp id="filtro.area" className="ms-0" />
        </Col>
        <Col md={3} className="d-flex align-items-center gap-1">
          <Form.Select aria-label="Filtrar por tipo" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t._id} value={t._id}>
                {t.nombre}
              </option>
            ))}
          </Form.Select>
          <ReqHelp id="filtro.tipo" className="ms-0" />
        </Col>
      </Row>
      <Row className="g-2 mb-3">
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text>Desde</InputGroup.Text>
            <Form.Control type="date" aria-label="Fecha desde" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text>Hasta</InputGroup.Text>
            <Form.Control type="date" aria-label="Fecha hasta" value={fechaHasta} min={fechaDesde || undefined} onChange={(e) => setFechaHasta(e.target.value)} />
          </InputGroup>
        </Col>
        <Col md={6} className="text-md-end d-flex align-items-center justify-content-md-end gap-1">
          <ReqHelp id="filtro.fechas" className="ms-0 me-2" />
          <Button variant="outline-secondary" onClick={() => setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}>
            {sortDirection === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
            {sortDirection === 'desc' ? <FaArrowDown className="ms-2" aria-hidden="true" /> : <FaArrowUp className="ms-2" aria-hidden="true" />}
          </Button>
          <ReqHelp id="filtro.orden" className="ms-0" />
        </Col>
      </Row>

      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando requisiciones" />
        </div>
      )}
      {isError && <Alert variant="danger">Error al cargar las requisiciones.</Alert>}

      {data && (
        <>
          <Card className="tt-card mb-3 position-relative">
            {isFetching && !isLoading && (
              <div className="position-absolute top-0 end-0 m-2">
                <Spinner size="sm" animation="border" variant="secondary" />
              </div>
            )}
            <Card.Body>
              <div className="table-responsive">
                <DataTable
                  data={rows}
                  columns={columns}
                  actions={(row: Requisicion) => (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      title="Ver detalle"
                      aria-label={`Ver ${row.consecutivo}`}
                      onClick={() => navigate(`/requisiciones/${row._id}`)}
                    >
                      <FaEye />
                    </Button>
                  )}
                />
              </div>
              {rows.length === 0 && <p className="text-center text-muted my-3 mb-0">{emptyMessage}</p>}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {rows.length} de {totalCount} requisiciones
            </small>
            <AppPagination page={page} pages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
      <GuiaModal show={showGuia} onHide={() => setShowGuia(false)} />
    </Container>
  );
};

export default RequisicionesListPage;
