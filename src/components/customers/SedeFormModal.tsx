import React, { useState, useEffect } from 'react';
import { Modal, Form, Row, Col, Button, Spinner } from 'react-bootstrap';
import { Sede, CreateSedeDto, UpdateSedeDto } from '@/types/sede.types';
import { useCreateSede, useUpdateSede } from '@/hooks/useSedes';

interface SedeFormModalProps {
  show: boolean;
  onHide: () => void;
  customerId: string;
  editingSede?: Sede | null;
  onSuccess?: () => void;
}

const SedeFormModal: React.FC<SedeFormModalProps> = ({ 
  show, 
  onHide, 
  customerId, 
  editingSede,
  onSuccess 
}) => {
  const createMutation = useCreateSede();
  const updateMutation = useUpdateSede();

  const [formData, setFormData] = useState({
    nombreSede: '',
    contact: '',
    departamento: '',
    telefono: '',
    ciudad: '',
    direccion: ''
  });

  // Resetear o cargar datos cuando cambia editingSede o show
  useEffect(() => {
    if (show) {
      if (editingSede) {
        setFormData({
          nombreSede: editingSede.nombreSede || '',
          contact: editingSede.contact || '',
          departamento: editingSede.departamento || '',
          telefono: editingSede.telefono || '',
          ciudad: editingSede.ciudad || '',
          direccion: editingSede.direccion || ''
        });
      } else {
        setFormData({
          nombreSede: '',
          contact: '',
          departamento: '',
          telefono: '',
          ciudad: '',
          direccion: '',
        });
      }
    }
  }, [show, editingSede]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSede) {
        await updateMutation.mutateAsync({
          id: editingSede._id!,
          data: formData as UpdateSedeDto
        });
      } else {
        await createMutation.mutateAsync({
          ...formData,
          Cliente: customerId
        } as CreateSedeDto);
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
          {editingSede ? 'Editar Sede' : 'Crear Nueva Sede'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de la Sede *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nombreSede}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    nombreSede: e.target.value 
                  }))}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    ciudad: e.target.value 
                  }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Departamento</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    departamento: e.target.value 
                  }))}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contacto</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contact: e.target.value 
                  }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    telefono: e.target.value 
                  }))}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Dirección</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                direccion: e.target.value 
              }))}
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
              editingSede ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SedeFormModal;
