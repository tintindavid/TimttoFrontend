import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCustomers } from '@/hooks/useCustomers';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useEquipoItems } from '@/hooks/useEquipoItems';
import { useCreateTicketsBatch } from '@/hooks/useTickets';
import { useAuth } from '@/context/AuthContext';
import { Customer } from '@/types/customer.types';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { EquipoItem } from '@/types/equipoItem.types';
import {
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_VALUES,
  formatBatchId,
} from '@/constants/ticket.constants';
import {
  CreateTicketBatchDto,
  CreateTicketEquipoPayload,
  TicketUrgency,
} from '@/types/ticket.types';

interface CreateTicketModalProps {
  show: boolean;
  onHide: () => void;
  onCreated?: (batchId: string, count: number) => void;
}

interface EquipoSelection {
  selected: boolean;
  observation: string;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  show,
  onHide,
  onCreated,
}) => {
  const { user } = useAuth();
  const createMutation = useCreateTicketsBatch();

  const [clienteId, setClienteId] = useState<string>('');
  const [sedeId, setSedeId] = useState<string>('');
  const [servicioId, setServicioId] = useState<string>('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [generalObservation, setGeneralObservation] = useState<string>('');
  const [equiposMap, setEquiposMap] = useState<Record<string, EquipoSelection>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Queries
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = useMemo<Customer[]>(
    () => (customersData?.data ?? []) as Customer[],
    [customersData],
  );

  const { data: sedesData, isLoading: loadingSedes } = useSedesByCustomer(
    clienteId,
    {},
    { enabled: !!clienteId },
  );

  // Si solo hay una sede entonces se selecciona automáticamente
  useEffect(() => {
    if (sedesData?.data && (sedesData.data as Sede[]).length === 1) {
      setSedeId((sedesData.data as Sede[])[0]._id || '');
    }
  }, [sedesData]);

  const sedes = useMemo<Sede[]>(
    () => (sedesData?.data ?? []) as Sede[], [sedesData]
  );

  const { data: serviciosData, isLoading: loadingServicios } = useServiciosByCustomer(
    clienteId,
    {},
    { enabled: !!clienteId },
  );

  // Si solo hay un servicio entonces se selecciona automáticamente
  useEffect(() => {
    if (serviciosData?.data && (serviciosData.data as Servicio[]).length === 1) {
      setServicioId((serviciosData.data as Servicio[])[0]._id || '');
    }
  }, [serviciosData]);
  const servicios = useMemo<Servicio[]>(
    () => (serviciosData?.data ?? []) as Servicio[],
    [serviciosData],
  );

  const equipoFilters = useMemo(() => {
    if (!clienteId) return undefined;
    const params: Record<string, string | number> = { ClienteId: clienteId, limit: 1000 };
    if (sedeId) params.SedeId = sedeId;
    if (servicioId) params.Servicio = servicioId;
    return params;
  }, [clienteId, sedeId, servicioId]);

  const { data: equiposData, isLoading: loadingEquipos } = useEquipoItems(equipoFilters);
  const allEquipos = useMemo<EquipoItem[]>(
    () => (equiposData?.data ?? []) as EquipoItem[],
    [equiposData],
  );

  // Filter equipos by sede + servicio client-side too (defensive against backend that ignores params).
  const equipos = useMemo<EquipoItem[]>(() => {
    return allEquipos.filter((e) => {
      if (sedeId && e.SedeId?._id !== sedeId) return false;
      if (servicioId && e.Servicio?._id !== servicioId) return false;
      return true;
    });
  }, [allEquipos, sedeId, servicioId]);

  // Reset child selections when parents change.
  useEffect(() => {
    setSedeId('');
    setServicioId('');
    setEquiposMap({});
  }, [clienteId]);

  useEffect(() => {
    setEquiposMap({});
  }, [sedeId, servicioId]);

  const handleClose = (): void => {
    setClienteId('');
    setSedeId('');
    setServicioId('');
    setUrgency('normal');
    setGeneralObservation('');
    setEquiposMap({});
    setSubmitError('');
    onHide();
  };

  const toggleEquipo = (equipoId: string): void => {
    setEquiposMap((prev) => {
      const next = { ...prev };
      const existing = next[equipoId];
      if (existing?.selected) {
        next[equipoId] = { selected: false, observation: '' };
      } else {
        next[equipoId] = { selected: true, observation: existing?.observation ?? '' };
      }
      return next;
    });
  };

  const setEquipoObservation = (equipoId: string, value: string): void => {
    setEquiposMap((prev) => ({
      ...prev,
      [equipoId]: {
        selected: prev[equipoId]?.selected ?? true,
        observation: value,
      },
    }));
  };

  const selectedCount = useMemo(
    () => Object.values(equiposMap).filter((v) => v.selected).length,
    [equiposMap],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    if (!clienteId || !sedeId || !servicioId) {
      setSubmitError('Seleccione cliente, sede y servicio.');
      return;
    }

    const equiposPayload: CreateTicketEquipoPayload[] = Object.entries(equiposMap)
      .filter(([, v]) => v.selected)
      .map(([equipoId, v]) => ({
        equipoId,
        observation: v.observation.trim() ? v.observation.trim() : undefined,
      }));

    if (equiposPayload.length === 0) {
      setSubmitError('Seleccione al menos un equipo.');
      return;
    }

    const payload: CreateTicketBatchDto = {
      ClienteId: clienteId,
      sedeId,
      servicioId,
      equipos: equiposPayload,
      urgency,
      generalObservation: generalObservation.trim()
        ? generalObservation.trim()
        : undefined,
    };

    try {
      const res = await createMutation.mutateAsync(payload);
      const data = res.data;
      toast.success(
        `${data.created} ticket(s) creados (${formatBatchId(data.batchId)}).`,
      );
      if (onCreated) onCreated(data.batchId, data.created);
      handleClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible crear los tickets.';
      setSubmitError(message);
    }
  };

  const requesterName =
    user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Crear Tickets</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form.Group className="mb-3" controlId="ticketCliente">
            <Form.Label>Cliente</Form.Label>
            {loadingCustomers ? (
              <div className="d-flex align-items-center gap-2">
                <Spinner size="sm" animation="border" />
                <span>Cargando clientes...</span>
              </div>
            ) : (
              <Form.Select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                aria-label="Seleccionar cliente"
              >
                <option value="">Seleccionar...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial || 'Sin nombre'}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

            {/** Si solo hay una sede entonces se selecciona automáticamente */}
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="ticketSede">
                <Form.Label>Sede</Form.Label>
                <Form.Select
                  value={sedeId}
                  onChange={(e) => setSedeId(e.target.value)}
                  disabled={!clienteId || loadingSedes}
                required
                aria-label="Seleccionar sede"
              >
                <option value="">{loadingSedes ? 'Cargando...' : 'Seleccionar...'}</option>
                {sedes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.nombreSede || 'Sin nombre'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="ticketServicio">
                <Form.Label>Servicio</Form.Label>
                <Form.Select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  disabled={!clienteId || loadingServicios}
                  required
                  aria-label="Seleccionar servicio"
                >
                  <option value="">{loadingServicios ? 'Cargando...' : 'Seleccionar...'}</option>
                  {servicios.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="ticketUrgency">
                <Form.Label>Urgencia</Form.Label>
                <Form.Select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                  aria-label="Seleccionar urgencia"
                >
                  {TICKET_URGENCY_VALUES.map((u) => (
                    <option key={u} value={u}>
                      {TICKET_URGENCY_LABELS[u]}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="ticketRequester">
                <Form.Label>Solicitante</Form.Label>
                <Form.Control
                  value={requesterName}
                  readOnly
                  disabled
                  aria-label="Solicitante (sesión actual)"
                />
                <Form.Text className="text-muted">
                  Se toma automáticamente del usuario en sesión.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="ticketGeneralObservation">
            <Form.Label>Observación general (opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={generalObservation}
              onChange={(e) => setGeneralObservation(e.target.value)}
              maxLength={1000}
              placeholder="Aplica a todos los equipos seleccionados..."
            />
          </Form.Group>

          <hr />

          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Equipos</h6>
            <Badge bg={selectedCount > 0 ? 'primary' : 'secondary'}>
              {selectedCount} seleccionado(s)
            </Badge>
          </div>

          {!clienteId || !sedeId || !servicioId ? (
            <Alert variant="info" className="py-2 mb-0">
              Seleccione cliente, sede y servicio para listar equipos.
            </Alert>
          ) : loadingEquipos ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner size="sm" animation="border" />
              <span>Cargando equipos...</span>
            </div>
          ) : equipos.length === 0 ? (
            <Alert variant="warning" className="py-2 mb-0">
              No hay equipos para esta combinación.
            </Alert>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {equipos.map((eq) => {
                const id = eq._id || '';
                const entry = equiposMap[id];
                const checked = !!entry?.selected;
                return (
                  <Card key={id} className="mb-2">
                    <Card.Body className="py-2 px-3">
                      <Form.Check
                        type="checkbox"
                        id={`equipo-${id}`}
                        checked={checked}
                        onChange={() => toggleEquipo(id)}
                        label={
                          <span>
                            <strong>
                              {eq.ItemId?.Nombre  || 'Equipo'}
                            </strong>
                            {eq.Marca && (
                              <span className="text-muted ms-2">
                                · {eq.Marca}
                              </span>
                            )}
                            {eq.Inventario && (
                              <span className="text-muted ms-2">
                                · {eq.Inventario}
                              </span>
                            )}
                            {eq.Serie && (
                              <span className="text-muted ms-2">
                                · Serie {eq.Serie}
                              </span>
                            )}
                            {eq.Ubicacion && (
                              <span className="text-muted ms-2">
                                · {eq.Ubicacion}
                              </span>
                            )}
                          </span>
                        }
                      />
                      {checked && (
                        <Form.Control
                          as="textarea"
                          rows={2}
                          className="mt-2"
                          placeholder="Observación específica del equipo (opcional)"
                          value={entry?.observation ?? ''}
                          onChange={(e) =>
                            setEquipoObservation(id, e.target.value)
                          }
                          maxLength={1000}
                          aria-label={`Observación para equipo ${id}`}
                        />
                      )}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              !clienteId ||
              !sedeId ||
              !servicioId ||
              selectedCount === 0 ||
              createMutation.isLoading
            }
          >
            {createMutation.isLoading
              ? 'Creando...'
              : `Crear ${selectedCount > 0 ? selectedCount : ''} ticket(s)`}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateTicketModal;
