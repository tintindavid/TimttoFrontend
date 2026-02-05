import React, { useState, useMemo, useCallback } from 'react';
import { 
  Card, Button, Table, Badge, Modal, Form, Row, Col, 
  Spinner, Alert, Dropdown 
} from 'react-bootstrap';
import { 
  useServiciosByCustomer, 
  useCreateServicio, 
  useUpdateServicio, 
  useDeleteServicio 
} from '@/hooks/useServicios';
import { Servicio, CreateServicioDto, UpdateServicioDto } from '@/types/servicio.types';
import ConfirmModal from '@/components/common/ConfirmModal';

interface CustomerServiciosSectionProps {
  customerId: string;
}

const CustomerServiciosSection: React.FC<CustomerServiciosSectionProps> = ({ customerId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [servicioToDelete, setServicioToDelete] = useState<Servicio | null>(null);

  // Query optimizada
  const { data, isLoading, error } = useServiciosByCustomer(customerId, {}, {
    enabled: !!customerId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false
  });

  const createMutation = useCreateServicio();
  const updateMutation = useUpdateServicio();
  const deleteMutation = useDeleteServicio();

  const [formData, setFormData] = useState({
    nombre: '',
    observacion: '',
    Status: 'Active'
  });

  // Datos memoizados
  const servicios = useMemo(() => data?.data || [], [data?.data]);
  
  const stats = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter(s => s.Status === 'Active').length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [servicios]);

  // Event handlers optimizados
  const resetForm = useCallback(() => {
    setFormData({
      nombre: '',
      observacion: '',
      Status: 'Active'
    });
    setEditingServicio(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const openEditModal = (servicio: Servicio) => {
    setFormData({
      nombre: servicio.nombre || '',
      observacion: servicio.observacion || '',
      Status: servicio.Status || 'Active'
    });
    setEditingServicio(servicio);
    setShowModal(true);
  };

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
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async () => {
    if (!servicioToDelete) return;

    try {
      await deleteMutation.mutateAsync(servicioToDelete._id!);
      setShowDeleteModal(false);
      setServicioToDelete(null);
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
    }
  };

  const openDeleteModal = (servicio: Servicio) => {
    setServicioToDelete(servicio);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  // Mostrar error pero permitir crear nuevos elementos

  return (
    <div className="p-4">
      {/*String(error) && (
        <Alert variant="danger" className="mb-3">
          Error al cargar los servicios del cliente. Puedes crear un nuevo servicio.
        </Alert>
      )*/}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Servicios ({servicios.length})
        </h5>
        <Button 
          variant="primary" 
          size="sm"
          onClick={openCreateModal}
        >
          + Agregar Servicio
        </Button>
      </div>

      {servicios.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h6>No hay servicios registrados</h6>
          <p className="mb-3">Agrega el primer servicio para este cliente.</p>
          <Button variant="primary" onClick={openCreateModal}>
            Crear Primer Servicio
          </Button>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Nombre del Servicio</th>
                <th>Observación</th>
                <th>Estado</th>
                <th className="text-center" style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio._id}>
                  <td>
                    <strong>{servicio.nombre}</strong>
                  </td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: 300 }}>
                      {servicio.observacion || (
                        <span className="text-muted fst-italic">Sin observación</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge bg={servicio.Status === 'Active' ? 'success' : 'secondary'}>
                      {servicio.Status || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Acciones
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => openEditModal(servicio)}>
                          Editar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => openDeleteModal(servicio)}
                        >
                          Eliminar
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal Crear/Editar Servicio */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
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
              onClick={() => setShowModal(false)}
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

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        show={showDeleteModal}
        title="Confirmar eliminación"
        body={`¿Eliminar el servicio "${servicioToDelete?.nombre}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default CustomerServiciosSection;