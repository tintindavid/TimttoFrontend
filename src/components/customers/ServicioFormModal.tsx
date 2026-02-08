import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types/servicio.types';
import { useCreateServicio, useUpdateServicio } from '@/hooks/useServicios';

interface ServicioFormModalProps {
  show: boolean;
  onHide: () => void;
  customerId: string;
  editingServicio?: Servicio | null;
  onSuccess?: () => void;
}

const ServicioFormModal: React.FC<ServicioFormModalProps> = ({ 
  show, 
  onHide, 
  customerId, 
  editingServicio,
  onSuccess 
}) => {
  const createMutation = useCreateServicio();
  const updateMutation = useUpdateServicio();

  const [formData, setFormData] = useState({
    nombre: '',
    observacion: '',
    Status: 'Active'
  });

  // Resetear o cargar datos cuando cambia editingServicio o show
  useEffect(() => {
    if (show) {
      if (editingServicio) {
        setFormData({
          nombre: editingServicio.nombre || '',
          observacion: editingServicio.observacion || '',
          Status: editingServicio.Status || 'Active'
        });
      } else {
        setFormData({
          nombre: '',
          observacion: '',
          Status: 'Active'
        });
      }
    }
  }, [show, editingServicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingServicio) {
        await updateMutation.mutateAsync({
          id: editingServicio._id!,
          data: formData as UpdateServicioDto
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          Cliente: customerId
        } as CreateServicioDto);
      }
      
      onSuccess?.();
      onHide();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingServicio ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Servicio *</Form.Label>
            <Form.Control
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                nombre: e.target.value 
              }))}
              placeholder="Ej: Mantenimiento Preventivo, Calibración..."
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={formData.Status}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                Status: e.target.value 
              }))}
            >
              <option value="Active">Activo</option>
              <option value="Inactive">Inactivo</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Observación</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.observacion}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                observacion: e.target.value 
              }))}
              placeholder="Detalles adicionales sobre el servicio..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={onHide}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              editingServicio ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ServicioFormModal;
