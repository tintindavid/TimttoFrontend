import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  InputGroup,
  OverlayTrigger,
  Pagination,
  ProgressBar,
  Row,
  Spinner,
  Tab,
  Tabs,
  Tooltip,
} from 'react-bootstrap';
import {
  FaBan,
  FaCheckCircle,
  FaEdit,
  FaEllipsisV,
  FaEye,
  FaPause,
  FaPlay,
  FaPlus,
  FaRedo,
  FaSearch,
  FaStickyNote,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import { useOTs, useDeleteOt } from '@/hooks/useOTs';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import DataTable from '@/components/common/DataTable';
import OtNotasModal from '@/components/ots/OtNotasModal';
import OtQuickDetailModal from '@/components/ots/OtQuickDetailModal';
import OtResponsablesModal from '@/components/ots/OtResponsablesModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 20;

// Backend `EstadoOt` is a free String; this list carries the states the
// admin actually files reports under (checked against the badge classifier
// below and against real DB values). If the domain grows, add here — the
// filter is an exact match so partial matches (e.g. "en proceso") need to
// live in this exact form.
const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En Proceso', label: 'En Proceso' },
  { value: 'Pausada', label: 'Pausada' },
  { value: 'Completada', label: 'Completada' },
  { value: 'Cerrada', label: 'Cerrada' },
  { value: 'Cancelada', label: 'Cancelada' },
];

const OTsPage: React.FC = () => {
  const navigate = useNavigate();
  const deleteMutation = useDeleteOt();
  const canManageResponsables = useHasPermission(PERMISSIONS.OTS_MANAGE_RESPONSABLES);
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [consecutivoInput, setConsecutivoInput] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [clienteNameInput, setClienteNameInput] = useState('');
  // "Todas las OTs" / "Mis OTs" — server-filtered via `?mine=true`, never
  // filtered client-side (spec: Frontend tabs "Todas las OTs" / "Mis OTs").
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const debouncedConsecutivo = useDebounce(consecutivoInput, 300);
  const debouncedClienteName = useDebounce(clienteNameInput, 300);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      Consecutivo: debouncedConsecutivo || undefined,
      EstadoOt: estadoFilter || undefined,
      // Partial match on Customer.Razonsocial resolved server-side (2026-08-02).
      clienteName: debouncedClienteName || undefined,
      mine: activeTab === 'mine' ? true : undefined,
    }),
    [page, debouncedConsecutivo, estadoFilter, debouncedClienteName, activeTab],
  );

  const { data, isLoading, isFetching, error } = useOTs(queryParams);
  const ots = data?.data || [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.pages || 1);
  const hasActiveFilter = Boolean(debouncedConsecutivo || estadoFilter || debouncedClienteName);

  const [notasOtId, setNotasOtId] = useState<string | null>(null);
  const [quickDetailOtId, setQuickDetailOtId] = useState<string | null>(null);
  const [responsablesOtId, setResponsablesOtId] = useState<string | null>(null);

  // Deep-link `?open_ot={id}` — set by NotificationBell when the user clicks
  // an `ot.responsible.assigned` notification (design.md D11). Opens the
  // existing quick-detail modal, then cleans the URL so a refresh doesn't
  // re-open it. `?open_notas={id}` follows the same pattern for the
  // `ot.note.added` event → opens the OtNotasModal.
  useEffect(() => {
    const otId = searchParams.get('open_ot');
    const notasId = searchParams.get('open_notas');
    if (otId || notasId) {
      if (otId) setQuickDetailOtId(otId);
      if (notasId) setNotasOtId(notasId);
      const next = new URLSearchParams(searchParams);
      next.delete('open_ot');
      next.delete('open_notas');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirma eliminar esta OT?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Placeholder handlers — the actual mutations live elsewhere and get
  // wired up as the workflow features land.
  const handleStartOT = (id: string) => console.log('Iniciar OT:', id);
  const handlePauseOT = (id: string) => console.log('Pausar OT:', id);
  const handleCompleteOT = (id: string) => console.log('Finalizar OT:', id);
  const handleCancelOT = (id: string) => {
    if (window.confirm('¿Está seguro de cancelar esta OT?')) console.log('Cancelar OT:', id);
  };
  const handleReopenOT = (id: string) => console.log('Reabrir OT:', id);

  const getEstadoBadge = (estado: string) => {
    const s = estado?.toLowerCase() || '';
    if (s.includes('pendiente') || s.includes('creada')) return <Badge bg="warning" text="dark">⏳ {estado}</Badge>;
    if (s.includes('proceso') || s.includes('en curso')) return <Badge bg="primary">🔄 {estado}</Badge>;
    if (s.includes('pausada') || s.includes('detenida')) return <Badge bg="secondary">⏸️ {estado}</Badge>;
    if (s.includes('completada') || s.includes('finalizada') || s.includes('cerrada')) return <Badge bg="success">✅ {estado}</Badge>;
    if (s.includes('cancelada')) return <Badge bg="danger">❌ {estado}</Badge>;
    return <Badge bg="info">{estado}</Badge>;
  };

  const getPrioridadBadge = (prioridad: string) => {
    const p = prioridad?.toLowerCase() || '';
    if (p.includes('alta') || p.includes('urgente')) return <Badge bg="danger" className="me-1">⚠️ Alta</Badge>;
    if (p.includes('media') || p.includes('normal')) return <Badge bg="warning" text="dark" className="me-1">📊 Media</Badge>;
    if (p.includes('baja')) return <Badge bg="secondary" className="me-1">⬇️ Baja</Badge>;
    return prioridad ? <Badge bg="secondary" className="me-1">{prioridad}</Badge> : null;
  };

  const columns = [
    {
      key: 'Consecutivo',
      label: 'N° OT',
      render: (row: any) => (
        <Button
          variant="link"
          className="fw-bold text-primary p-0 text-decoration-none"
          onClick={() => navigate(`/ots/${row._id}`)}
        >
          {row.Consecutivo || row.numeroOT || 'N/A'}
        </Button>
      ),
    },
    {
      key: 'notas',
      label: 'Notas',
      render: (row: any) => {
        const count = Array.isArray(row.notas) ? row.notas.length : 0;
        return (
          <OverlayTrigger placement="top" overlay={<Tooltip id={`notas-${row._id}`}>Ver / agregar notas</Tooltip>}>
            <Button
              variant="link"
              size="sm"
              className="text-secondary p-0 position-relative"
              onClick={() => setNotasOtId(row._id)}
              aria-label="Notas"
            >
              <FaStickyNote size={18} />
              {count > 0 && (
                <Badge
                  bg="warning"
                  text="dark"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.65rem' }}
                >
                  {count}
                </Badge>
              )}
            </Button>
          </OverlayTrigger>
        );
      },
    },
    {
      key: 'ClienteId',
      label: 'Cliente',
      render: (row: any) => {
        if (typeof row.ClienteId === 'object' && row.ClienteId?.Razonsocial) {
          return (
            <div>
              <div className="fw-bold">{row.ClienteId.Razonsocial}</div>
              <small className="text-muted">{row.ClienteId.Ciudad || ''}</small>
            </div>
          );
        }
        return row.ClienteId || 'Sin cliente';
      },
    },
    {
      // Column unification (design.md D13): "Tipo de servicio" + "Prioridad"
      // collapse into a single "T. Servicio" column — type on the first
      // line, priority badge on the second — so the table doesn't grow.
      key: 'tipoServicio',
      label: 'T. Servicio',
      render: (row: any) => (
        <div style={{ minWidth: 110 }}>
          <div>
            <Badge bg="info" className="text-wrap">
              {row.TipoServicio || row.tipoMantenimiento || 'N/A'}
            </Badge>
          </div>
          <div className="mt-1">{getPrioridadBadge(row.OtPrioridad || row.urgencia || '')}</div>
        </div>
      ),
    },
    {
      // "Estado" + "Avance" collapse into a single column (design.md D13).
      key: 'estado',
      label: 'Estado',
      render: (row: any) => {
        const avance = typeof row.Avance === 'number' ? row.Avance : parseInt(row.Avance || '0');
        const variant = avance < 30 ? 'danger' : avance < 70 ? 'warning' : 'success';
        return (
          <div style={{ minWidth: 120 }}>
            <div>{getEstadoBadge(row.EstadoOt || 'Pendiente')}</div>
            <ProgressBar
              now={avance}
              label={`${avance}%`}
              variant={variant}
              className="mt-1"
              style={{ height: '16px' }}
            />
          </div>
        );
      },
    },
    {
      key: 'responsables',
      label: 'Responsable(s)',
      render: (row: any) => {
        const activeEntry = (row.programaciones || []).find((p: any) => p.isActive);
        const responsables = activeEntry?.responsables || [];
        if (responsables.length === 0) {
          return (
            <OverlayTrigger placement="top" overlay={<Tooltip id={`sin-programar-${row._id}`}>Sin programar</Tooltip>}>
              <span className="text-muted">—</span>
            </OverlayTrigger>
          );
        }
        return (
          <div>
            {responsables.map((r: any) => (
              <div key={r.userId} className="small">
                {r.snapshotName}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'FechaCreacion',
      label: 'Fecha Creación',
      render: (row: any) => {
        const fecha = row.FechaCreacion || row.createdAt;
        return fecha ? new Date(fecha).toLocaleDateString('es-ES') : 'N/A';
      },
    },
  ];

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Órdenes de Trabajo</h1>
          <p className="text-muted mb-0">Listado de órdenes de trabajo</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/ots/new')}>
            <FaPlus className="me-1" /> Crear OT
          </Button>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => {
          setActiveTab((key as 'all' | 'mine') || 'all');
          setPage(1);
        }}
        className="mb-3"
      >
        <Tab eventKey="all" title="Todas las OTs" />
        <Tab eventKey="mine" title="Mis OTs" />
      </Tabs>

      {/* Filter row — pattern mirrors CustomersPage: debounced text +
          dropdowns, each reset to page 1 on change to avoid landing on an
          empty page of a stale result set. */}
      <Row className="g-2 mb-3">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por N° OT..."
              value={consecutivoInput}
              onChange={(event) => { setConsecutivoInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre de cliente..."
              value={clienteNameInput}
              onChange={(event) => { setClienteNameInput(event.target.value); setPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Form.Select
            value={estadoFilter}
            onChange={(event) => { setEstadoFilter(event.target.value); setPage(1); }}
            aria-label="Filtrar por estado"
          >
            {ESTADO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {isLoading && <div className="d-flex justify-content-center my-4"><Spinner animation="border" variant="primary" /></div>}
      {Boolean(error) && <Alert variant="danger">Error al cargar las OTs.</Alert>}

      {notasOtId && (
        <OtNotasModal show={Boolean(notasOtId)} onHide={() => setNotasOtId(null)} otId={notasOtId} />
      )}

      <OtQuickDetailModal
        show={Boolean(quickDetailOtId)}
        onHide={() => setQuickDetailOtId(null)}
        otId={quickDetailOtId}
      />

      <OtResponsablesModal
        show={Boolean(responsablesOtId)}
        onHide={() => setResponsablesOtId(null)}
        otId={responsablesOtId}
      />

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
                data={ots}
                columns={columns}
                actions={(row: any) => {
                  const estado = row.EstadoOt?.toLowerCase() || 'pendiente';
                  const isPendiente = estado.includes('pendiente') || estado.includes('creada');
                  const isEnProceso = estado.includes('proceso') || estado.includes('en curso');
                  const isPausada = estado.includes('pausada');
                  const isCompletada = estado.includes('completada') || estado.includes('finalizada') || estado.includes('cerrada');
                  const isCancelada = estado.includes('cancelada');

                  return (
                    <div className="d-inline-flex gap-1">
                      {/* Quick "peek" — separate button so the admin doesn't
                          need to open the dropdown just to see the equipos
                          and any client notes on the OT. Opens
                          OtQuickDetailModal in place. */}
                      <OverlayTrigger placement="top" overlay={<Tooltip id={`peek-${row._id}`}>Ver detalle rápido</Tooltip>}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => setQuickDetailOtId(row._id)}
                          aria-label={`Ver detalle rápido de la OT ${row.Consecutivo || row._id}`}
                        >
                          <FaEye />
                        </Button>
                      </OverlayTrigger>

                      <Dropdown align="end">
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          id={`dropdown-${row._id}`}
                          className="border-0"
                        >
                          <FaEllipsisV />
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => navigate(`/ots/${row._id}`)}>
                            <FaEye className="me-2" />
                            Ver Detalles
                          </Dropdown.Item>

                          {/* ots:manage-responsables gate — a technician who can't
                              reprogram the OT should not even see the action. */}
                          {canManageResponsables && (
                            <Dropdown.Item onClick={() => setResponsablesOtId(row._id)}>
                              <FaUsers className="me-2 text-primary" />
                              Responsables
                            </Dropdown.Item>
                          )}

                          <Dropdown.Divider />

                          {isPendiente && (
                            <>
                              <Dropdown.Item onClick={() => handleStartOT(row._id)}>
                                <FaPlay className="me-2 text-success" /> Iniciar OT
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => navigate(`/ots/${row._id}/edit`)}>
                                <FaEdit className="me-2 text-warning" /> Editar
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => handleCancelOT(row._id)} className="text-danger">
                                <FaBan className="me-2" /> Cancelar OT
                              </Dropdown.Item>
                            </>
                          )}

                          {isEnProceso && (
                            <>
                              <Dropdown.Item onClick={() => handlePauseOT(row._id)}>
                                <FaPause className="me-2 text-warning" /> Pausar OT
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleCompleteOT(row._id)}>
                                <FaCheckCircle className="me-2 text-success" /> Finalizar OT
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => navigate(`/ots/${row._id}/edit`)}>
                                <FaEdit className="me-2 text-warning" /> Editar
                              </Dropdown.Item>
                            </>
                          )}

                          {isPausada && (
                            <>
                              <Dropdown.Item onClick={() => handleStartOT(row._id)}>
                                <FaPlay className="me-2 text-success" /> Reanudar OT
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => handleCancelOT(row._id)} className="text-danger">
                                <FaBan className="me-2" /> Cancelar OT
                              </Dropdown.Item>
                            </>
                          )}

                          {isCompletada && (
                            <Dropdown.Item onClick={() => handleReopenOT(row._id)}>
                              <FaRedo className="me-2 text-primary" /> Reabrir OT
                            </Dropdown.Item>
                          )}

                          {isCancelada && (
                            <Dropdown.Item onClick={() => handleReopenOT(row._id)}>
                              <FaRedo className="me-2 text-primary" /> Reactivar OT
                            </Dropdown.Item>
                          )}

                          {(isPendiente || isCancelada) && (
                            <>
                              <Dropdown.Divider />
                              <Dropdown.Item onClick={() => handleDelete(row._id)} className="text-danger">
                                <FaTrash className="me-2" /> Eliminar
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  );
                }}
              />
              {ots.length === 0 && !isLoading && (
                <p className="text-center text-muted my-3 mb-0">
                  {hasActiveFilter
                    ? 'Ninguna OT coincide con los filtros.'
                    : activeTab === 'mine'
                      ? 'Aún no tienes OTs asignadas.'
                      : 'Aún no hay órdenes de trabajo registradas.'}
                </p>
              )}
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Mostrando {ots.length} de {pagination?.total ?? ots.length} OTs
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
    </Container>
  );
};

export default OTsPage;
