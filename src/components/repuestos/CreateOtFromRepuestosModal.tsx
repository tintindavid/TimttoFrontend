import React, { useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import Select from 'react-select';
import { useUsers } from '@/hooks/useUsers';

interface CreateOtFromRepuestosModalProps {
  show: boolean;
  onHide: () => void;
  selectedCount: number;
  selectedItems: Array<{ _id: string; nombre: string; equipoLabel?: string }>;
  onSubmit: (payload: {
    ResponsableId: string;
    FechaEstimadaEntrega?: string;
    observacion?: string;
    OtPrioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  }) => Promise<void>;
  submitting?: boolean;
}

const CreateOtFromRepuestosModal: React.FC<CreateOtFromRepuestosModalProps> = ({
  show,
  onHide,
  selectedCount,
  selectedItems,
  onSubmit,
  submitting = false,
}) => {
  const { data: usersData, isLoading: isLoadingUsers, isError: isUsersError } = useUsers({ page: 1, limit: 100 });
  const [responsableId, setResponsableId] = useState('');
  const initialDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState(initialDate);
  const [observacion, setObservacion] = useState('');
  const [otPrioridad, setOtPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Urgente'>('Media');
  const users = usersData?.data || [];
  const userOptions = users.map((u: any) => ({
    value: u._id,
    label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
  }));

  const canSubmit = useMemo(
    () => !!responsableId && !!fechaEstimadaEntrega && !submitting,
    [responsableId, fechaEstimadaEntrega, submitting]
  );

  const handleSubmit = async () => {
    if (!responsableId) return;
    await onSubmit({
      ResponsableId: responsableId,
      FechaEstimadaEntrega: fechaEstimadaEntrega || undefined,
      observacion: observacion || undefined,
      OtPrioridad: otPrioridad,
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear OT desde repuestos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">Seleccionados: {selectedCount} repuestos.</p>
        <div className="mb-3">
          <div className="small text-muted">Tipo de OT</div>
          <strong>Correctivo</strong>
        </div>
        <div className="mb-3" style={{ maxHeight: 120, overflow: 'auto' }}>
          {selectedItems.map((item) => (
            <div key={item._id} className="small text-muted">
              {item.nombre} {item.equipoLabel ? `- ${item.equipoLabel}` : ''}
            </div>
          ))}
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Técnico responsable</Form.Label>
          <Select
            options={userOptions}
            placeholder="Buscar técnico..."
            value={userOptions.find((opt) => opt.value === responsableId) || null}
            onChange={(selected) => setResponsableId(selected?.value || '')}
            isClearable
            isLoading={isLoadingUsers}
            noOptionsMessage={() => (isUsersError ? 'No fue posible cargar técnicos' : 'No hay técnicos disponibles')}
          />
          <Form.Text className="text-muted">
            Selecciona un usuario para asignarlo como responsable.
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Fecha estimada de entrega</Form.Label>
          <Form.Control
            type="date"
            value={fechaEstimadaEntrega}
            onChange={(e) => setFechaEstimadaEntrega(e.target.value)}
            isInvalid={!fechaEstimadaEntrega && submitting}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Prioridad OT</Form.Label>
          <Form.Select value={otPrioridad} onChange={(e) => setOtPrioridad(e.target.value as any)}>
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </Form.Select>
        </Form.Group>
        <Form.Group>
          <Form.Label>Observación</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Comentario opcional"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </Form.Group>
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
