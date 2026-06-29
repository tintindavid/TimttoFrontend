import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  ListGroup,
  Pagination,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap';
import { FaFilter, FaPlus, FaTools } from 'react-icons/fa';
import { useTicketsList, useTicketStats } from '@/hooks/useTickets';
import { useCustomers } from '@/hooks/useCustomers';
import { useUsers } from '@/hooks/useUsers';
import {
  TICKET_STATUS_TAB_LABELS,
  TICKET_STATUS_VALUES,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_VALUES,
  computeMaxOtPriority,
  OT_PRIORITY_VARIANTS,
} from '@/constants/ticket.constants';
import {
  Ticket,
  TicketListFilters,
  TicketStatus,
  TicketUrgency,
} from '@/types/ticket.types';
import { Customer } from '@/types/customer.types';
import { User } from '@/types/user.types';
import TicketListItem from './components/TicketListItem';
import CreateTicketModal from './components/CreateTicketModal';
import AssignTicketModal from './components/AssignTicketModal';
import CancelTicketModal from './components/CancelTicketModal';
import AddNoteModal from './components/AddNoteModal';
import CreateOTFromTicketsModal from './components/CreateOTFromTicketsModal';

const PAGE_LIMIT = 20;

const resolveClienteId = (t: Ticket): string => {
  if (typeof t.ClienteId === 'string') return t.ClienteId;
  return t.ClienteId?._id || '';
};

const TicketsPage: React.FC = () => {
  const [statusTab, setStatusTab] = useState<TicketStatus>('pendiente');
  const [page, setPage] = useState<number>(1);
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [batchIdFilter, setBatchIdFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showCreateOT, setShowCreateOT] = useState<boolean>(false);
  const [assignTarget, setAssignTarget] = useState<Ticket | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Ticket | null>(null);
  const [noteTarget, setNoteTarget] = useState<Ticket | null>(null);

  const [selected, setSelected] = useState<Record<string, true>>({});

  const filters: TicketListFilters = useMemo(() => {
    const f: TicketListFilters = {
      status: statusTab,
      page,
      limit: PAGE_LIMIT,
    };
    if (clienteFilter) f.ClienteId = clienteFilter;
    if (urgencyFilter) f.urgency = urgencyFilter as TicketUrgency;
    if (assigneeFilter) f.assignedTo = assigneeFilter;
    if (batchIdFilter) f.batchId = batchIdFilter.trim();
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    return f;
  }, [statusTab, page, clienteFilter, urgencyFilter, assigneeFilter, batchIdFilter, dateFrom, dateTo]);

  const ticketsQuery = useTicketsList(filters);
  const statsQuery = useTicketStats();
  const customersQuery = useCustomers();
  const usersQuery = useUsers({ limit: 100 });

  const tickets: Ticket[] = (ticketsQuery.data?.data ?? []) as Ticket[];
  const customers: Customer[] = (customersQuery.data?.data ?? []) as Customer[];
  const users: User[] = (usersQuery.data?.data ?? []) as User[];

  const selectedTickets = useMemo(
    () => tickets.filter((t) => selected[t._id]),
    [tickets, selected],
  );

  const sameClienteSelected = useMemo(() => {
    if (selectedTickets.length === 0) return true;
    const first = resolveClienteId(selectedTickets[0]);
    return selectedTickets.every((t) => resolveClienteId(t) === first);
  }, [selectedTickets]);

  const allPendienteSelected = useMemo(
    () => selectedTickets.length > 0 && selectedTickets.every((t) => t.status === 'pendiente' && !t.workOrderId),
    [selectedTickets],
  );

  const canCreateOT = statusTab === 'pendiente' && allPendienteSelected && sameClienteSelected;

  const projectedOtPriority = useMemo(
    () => computeMaxOtPriority(selectedTickets.map((t) => t.urgency)),
    [selectedTickets],
  );

  const handleTabSelect = (key: string | null): void => {
    if (!key) return;
    if ((TICKET_STATUS_VALUES as string[]).includes(key)) {
      setStatusTab(key as TicketStatus);
      setPage(1);
      setSelected({});
    }
  };

  const toggleSelect = (ticketId: string): void => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[ticketId]) delete next[ticketId];
      else next[ticketId] = true;
      return next;
    });
  };

  const clearFilters = (): void => {
    setClienteFilter('');
    setUrgencyFilter('');
    setAssigneeFilter('');
    setBatchIdFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const stats = statsQuery.data?.data;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h3 className="m-0">Tickets</h3>
          {stats && (
            <div className="small text-muted">
              Total: {stats.total} · Pendientes: {stats.pendiente} · En Proceso: {stats.en_proceso} · Cerrados: {stats.cerrado} · Cancelados: {stats.cancelado}
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          {canCreateOT && (
            <Button
              variant="warning"
              onClick={() => setShowCreateOT(true)}
              aria-label="Crear OT desde tickets seleccionados"
            >
              <FaTools className="me-2" />
              Crear OT desde {selectedTickets.length} ticket(s)
              <Badge bg={OT_PRIORITY_VARIANTS[projectedOtPriority]} className="ms-2">
                {projectedOtPriority}
              </Badge>
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            aria-label="Crear ticket"
          >
            <FaPlus className="me-2" />
            Crear Ticket
          </Button>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body className="py-3">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div style={{ minWidth: 180 }}>
              <Form.Label className="small mb-1">Cliente</Form.Label>
              <Form.Select
                size="sm"
                value={clienteFilter}
                onChange={(e) => { setClienteFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial || 'Sin nombre'}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div style={{ minWidth: 140 }}>
              <Form.Label className="small mb-1">Urgencia</Form.Label>
              <Form.Select
                size="sm"
                value={urgencyFilter}
                onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todas</option>
                {TICKET_URGENCY_VALUES.map((u) => (
                  <option key={u} value={u}>{TICKET_URGENCY_LABELS[u]}</option>
                ))}
              </Form.Select>
            </div>
            <div style={{ minWidth: 180 }}>
              <Form.Label className="small mb-1">Responsable</Form.Label>
              <Form.Select
                size="sm"
                value={assigneeFilter}
                onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                {users.filter((u) => ['admin', 'technician'].includes(u.role)).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div style={{ minWidth: 160 }}>
              <Form.Label className="small mb-1">Batch ID</Form.Label>
              <Form.Control
                size="sm"
                value={batchIdFilter}
                onChange={(e) => { setBatchIdFilter(e.target.value); setPage(1); }}
                placeholder="BTC-..."
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <Form.Label className="small mb-1">Desde</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <Form.Label className="small mb-1">Hasta</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
            <Button size="sm" variant="outline-secondary" onClick={clearFilters}>
              <FaFilter className="me-1" />
              Limpiar
            </Button>
          </div>
        </Card.Body>
      </Card>

      {selectedTickets.length > 0 && !canCreateOT && (
        <Alert variant="warning" className="py-2">
          {!sameClienteSelected
            ? 'Seleccione tickets de un único cliente para crear OT.'
            : 'Solo se pueden agrupar tickets en estado pendiente sin OT asociada.'}
        </Alert>
      )}

      <Tabs activeKey={statusTab} onSelect={handleTabSelect} className="mb-2">
        {TICKET_STATUS_VALUES.map((s) => (
          <Tab eventKey={s} title={TICKET_STATUS_TAB_LABELS[s]} key={s} />
        ))}
      </Tabs>

      {ticketsQuery.isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : ticketsQuery.isError ? (
        <Alert variant="danger">
          Error al cargar tickets: {ticketsQuery.error?.message}
        </Alert>
      ) : tickets.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5 text-muted">
            No hay tickets en {TICKET_STATUS_TAB_LABELS[statusTab].toLowerCase()}.
          </Card.Body>
        </Card>
      ) : (
        <ListGroup>
          {tickets.map((t) => (
            <TicketListItem
              key={t._id}
              ticket={t}
              selectable={statusTab === 'pendiente'}
              selected={!!selected[t._id]}
              onToggleSelect={toggleSelect}
              onAssign={(tk) => setAssignTarget(tk)}
              onCancel={(tk) => setCancelTarget(tk)}
            />
          ))}
        </ListGroup>
      )}

      {tickets.length >= PAGE_LIMIT && (
        <div className="d-flex justify-content-center mt-3">
          <Pagination size="sm">
            <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
            <Pagination.Item active>{page}</Pagination.Item>
            <Pagination.Next onClick={() => setPage((p) => p + 1)} />
          </Pagination>
        </div>
      )}

      <CreateTicketModal show={showCreate} onHide={() => setShowCreate(false)} />

      <CreateOTFromTicketsModal
        show={showCreateOT}
        onHide={() => {
          setSelected({});
          setShowCreateOT(false);
        }}
        tickets={selectedTickets}
      />

      <AssignTicketModal
        show={!!assignTarget}
        onHide={() => setAssignTarget(null)}
        ticket={assignTarget}
      />

      <CancelTicketModal
        show={!!cancelTarget}
        onHide={() => setCancelTarget(null)}
        ticket={cancelTarget}
      />

      <AddNoteModal
        show={!!noteTarget}
        onHide={() => setNoteTarget(null)}
        ticket={noteTarget}
      />
    </div>
  );
};

export default TicketsPage;
