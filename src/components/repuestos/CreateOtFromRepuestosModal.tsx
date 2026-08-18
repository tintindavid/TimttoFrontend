import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import Select from 'react-select';
import { useUsersEligibleFor } from '@/hooks/useUsers';
import { PERMISSIONS } from '@/constants/permissions';

interface CreateOtFromRepuestosModalProps {
  show: boolean;
  onHide: () => void;
  selectedCount: number;
  selectedItems: Array<{ _id: string; nombre: string; equipoLabel?: string }>;
  onSubmit: (payload: {
    responsableUserIds: string[];
    fechaInicio: string;
    fechaFin: string;
    nota?: string;
    OtPrioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  }) => Promise<void>;
  submitting?: boolean;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const CreateOtFromRepuestosModal: React.FC<CreateOtFromRepuestosModalProps> = ({
  show,
  onHide,
  selectedCount,
  selectedItems,
  onSubmit,
  submitting = false,
}) => {
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
  } = useUsersEligibleFor(PERMISSIONS.OTS_CAN_BE_RESPONSIBLE);

  const [responsableIds, setResponsableIds] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState(todayIso());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const [nota, setNota] = useState('');
  const [otPrioridad, setOtPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Urgente'>('Media');

  // Reset every time the modal opens for a new batch.
  useEffect(() => {
    if (show) {
      setResponsableIds([]);
      setFechaInicio(todayIso());
      setFechaFin(todayIso());
      setNota('');
      setOtPrioridad('Media');
    }
  }, [show]);

  const userOptions = useMemo(
    () =>
      (usersData?.data || []).map((u: any) => ({
        value: u._id as string,
        label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
      })),
    [usersData],
  );

  const isRangeInvalid = fechaInicio && fechaFin && fechaFin < fechaInicio;
  const canSubmit = responsableIds.length > 0 && !!fechaInicio && !!fechaFin && !isRangeInvalid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      responsableUserIds: responsableIds,
      fechaInicio,
      fechaFin,
      nota: nota.trim() || undefined,
      OtPrioridad: otPrioridad,
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear OT desde repuestos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-1">Seleccionados: {selectedCount} repuestos.</p>
        <div className="mb-3">
          <span className="text-muted small">Tipo de OT: </span>
          <strong>Correctivo</strong>
        </div>
        {selectedItems.length > 0 && (
          <div className="mb-3 p-2 bg-light rounded" style={{ maxHeight: 120, overflow: 'auto' }}>
            {selectedItems.map((item) => (
              <div key={item._id} className="small text-muted">
                {item.nombre} {item.equipoLabel ? `- ${item.equipoLabel}` : ''}
              </div>
            ))}
          </div>
        )}

        <Form.Group className="mb-3">
          <Form.Label htmlFor="ot-repuestos-responsables">Responsables</Form.Label>
          <Select
            inputId="ot-repuestos-responsables"
            isMulti
            options={userOptions}
            value={userOptions.filter((opt) => responsableIds.includes(opt.value))}
            onChange={(selected) => setResponsableIds(selected.map((s) => s.value))}
            placeholder="Seleccionar responsables..."
            classNamePrefix="react-select"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            // Modal z-index (1055) > react-select portal default (1) — force above.
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            isLoading={isLoadingUsers}
            noOptionsMessage={() => (isUsersError ? 'No fue posible cargar responsables' : 'No hay usuarios elegibles (permiso ots:can-be-responsible)')}
            aria-label="Responsables"
          />
          {responsableIds.length === 0 && (
            <Form.Text className="text-muted">Debes asignar al menos un responsable.</Form.Text>
          )}
        </Form.Group>

        <Row className="g-3 mb-3">
          <Col md={6}>
            <Form.Label htmlFor="ot-repuestos-fecha-inicio">Fecha inicio</Form.Label>
            <Form.Control
              id="ot-repuestos-fecha-inicio"
              type="date"
              value={fechaInicio}
              min={todayIso()}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label htmlFor="ot-repuestos-fecha-fin">Fecha fin</Form.Label>
            <Form.Control
              id="ot-repuestos-fecha-fin"
              type="date"
              value={fechaFin}
              min={fechaInicio || todayIso()}
              onChange={(e) => setFechaFin(e.target.value)}
              isInvalid={Boolean(isRangeInvalid)}
            />
            {isRangeInvalid && (
              <Form.Text className="text-danger">La fecha fin no puede ser anterior a la fecha de inicio.</Form.Text>
            )}
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Prioridad</Form.Label>
          <Form.Select value={otPrioridad} onChange={(e) => setOtPrioridad(e.target.value as any)}>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label htmlFor="ot-repuestos-nota">Nota inicial (opcional)</Form.Label>
          <Form.Control
            id="ot-repuestos-nota"
            as="textarea"
            rows={3}
            placeholder="Ej.: repuesto ya en stock, se debe instalar lo más pronto posible."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={2000}
          />
          <Form.Text className="text-muted">
            La nota queda en el hilo de notas de la OT y los responsables serán notificados si se agregan más notas.
          </Form.Text>
        </Form.Group>

        {selectedCount === 0 && (
          <Alert variant="warning" className="mt-3 mb-0">
            No hay repuestos seleccionados.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cerrar</Button>
        <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? 'Creando...' : 'Crear OT'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateOtFromRepuestosModal;
