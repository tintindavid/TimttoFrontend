import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  PUBLIC_NAME_REGEX,
  PUBLIC_POSITION_MAX,
  PUBLIC_POSITION_MIN,
  TICKET_URGENCY_LABELS,
  TICKET_URGENCY_VALUES,
  formatBatchId,
} from '@/constants/ticket.constants';
import { useCreatePublicTickets, usePublicEquipments } from '@/hooks/usePublicTicket';
import { CreateTicketEquipoPayload, TicketUrgency } from '@/types/ticket.types';
import { EquipoItem } from '@/types/equipoItem.types';

interface EquipoSelection {
  selected: boolean;
  observation: string;
}

const isValidName = (n: string): boolean => PUBLIC_NAME_REGEX.test(n);
const isValidPosition = (p: string): boolean =>
  p.length >= PUBLIC_POSITION_MIN && p.length <= PUBLIC_POSITION_MAX;

const PublicCreateTicketForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [urgency, setUrgency] = useState<TicketUrgency>('normal');
  const [generalObservation, setGeneralObservation] = useState<string>('');
  const [equiposMap, setEquiposMap] = useState<Record<string, EquipoSelection>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const equiposQuery = usePublicEquipments();
  const createMutation = useCreatePublicTickets();

  const equipos: EquipoItem[] = (equiposQuery.data?.data ?? []) as EquipoItem[];

  const selectedCount = useMemo(
    () => Object.values(equiposMap).filter((v) => v.selected).length,
    [equiposMap],
  );

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

  const reset = (): void => {
    setName('');
    setPosition('');
    setUrgency('normal');
    setGeneralObservation('');
    setEquiposMap({});
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');

    const trimmedName = name.trim();
    const trimmedPosition = position.trim();

    if (!isValidName(trimmedName)) {
      setSubmitError('Nombre inválido. Use solo letras y espacios (3 a 80 caracteres).');
      return;
    }
    if (!isValidPosition(trimmedPosition)) {
      setSubmitError(`Cargo inválido (${PUBLIC_POSITION_MIN}–${PUBLIC_POSITION_MAX} caracteres).`);
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

    try {
      const res = await createMutation.mutateAsync({
        equipos: equiposPayload,
        urgency,
        generalObservation: generalObservation.trim() ? generalObservation.trim() : undefined,
        requestedBy: { name: trimmedName, position: trimmedPosition },
      });
      const data = res.data;
      toast.success(
        `${data.created} solicitud(es) enviadas correctamente (${formatBatchId(data.batchId)}).`,
      );
      reset();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No fue posible enviar la solicitud.';
      setSubmitError(message);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <h6 className="mb-2">Solicitante</h6>
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group className="mb-3" controlId="publicName">
                <Form.Label>Nombre completo</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  isInvalid={name.length > 0 && !isValidName(name.trim())}
                />
                <Form.Control.Feedback type="invalid">
                  Solo letras y espacios (3 a 80 caracteres).
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} md={4}>
              <Form.Group className="mb-3" controlId="publicPosition">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  maxLength={PUBLIC_POSITION_MAX}
                  required
                  isInvalid={position.length > 0 && !isValidPosition(position.trim())}
                />
                <Form.Control.Feedback type="invalid">
                  Entre {PUBLIC_POSITION_MIN} y {PUBLIC_POSITION_MAX} caracteres.
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} md={2}>
              <Form.Group className="mb-3" controlId="publicUrgency">
                <Form.Label>Urgencia</Form.Label>
                <Form.Select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
                >
                  {TICKET_URGENCY_VALUES.map((u) => (
                    <option key={u} value={u}>{TICKET_URGENCY_LABELS[u]}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="publicGeneralObservation">
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

          {equiposQuery.isLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spinner size="sm" animation="border" />
              <span>Cargando equipos...</span>
            </div>
          ) : equipos.length === 0 ? (
            <Alert variant="warning" className="py-2">
              No hay equipos disponibles en este servicio.
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
                        id={`public-equipo-${id}`}
                        checked={checked}
                        onChange={() => toggleEquipo(id)}
                        label={
                          <span>
                            <strong>{eq.ItemId?.Nombre || 'Equipo'}</strong>
                            {eq.Marca && <span className="text-muted ms-2">· {eq.Marca}</span>}
                            {eq.Inventario && <span className="text-muted ms-2">· {eq.Inventario}</span>}
                            {eq.Serie && <span className="text-muted ms-2">· Serie {eq.Serie}</span>}
                            {eq.Ubicacion && <span className="text-muted ms-2">· {eq.Ubicacion}</span>}
                          </span>
                        }
                      />
                      {checked && (
                        <Form.Control
                          as="textarea"
                          rows={2}
                          className="mt-2"
                          placeholder="¿Qué le está pasando al equipo? (opcional)"
                          value={entry?.observation ?? ''}
                          onChange={(e) => setEquipoObservation(id, e.target.value)}
                          maxLength={1000}
                        />
                      )}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="d-grid mt-3">
            <Button
              type="submit"
              variant="primary"
              disabled={selectedCount === 0 || createMutation.isLoading}
            >
              {createMutation.isLoading
                ? 'Enviando...'
                : `Enviar ${selectedCount > 0 ? selectedCount : ''} solicitud(es)`}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PublicCreateTicketForm;
