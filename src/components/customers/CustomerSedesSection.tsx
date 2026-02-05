import React, { useState, useMemo, useCallback } from 'react';
import { 
  Card, Button, Table, Badge, Modal, Form, Row, Col, 
  Spinner, Alert, Dropdown 
} from 'react-bootstrap';
import { 
  useSedesByCustomer, 
  useCreateSede, 
  useUpdateSede, 
  useDeleteSede 
} from '@/hooks/useSedes';
import { Sede, CreateSedeDto, UpdateSedeDto } from '@/types/sede.types';
import ConfirmModal from '@/components/common/ConfirmModal';

interface CustomerSedesSectionProps {
  customerId: string;
}

const CustomerSedesSection: React.FC<CustomerSedesSectionProps> = ({ customerId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState<Sede | null>(null);

  // Query optimizada con configuración más agresiva
  const queryOptions = useMemo(() => ({
    enabled: !!customerId && customerId.length > 0
  }), [customerId]);

  const { data, isLoading, error } = useSedesByCustomer(customerId, {}, queryOptions);

  console.log('Sedes data:', error);
  const createMutation = useCreateSede();
  const updateMutation = useUpdateSede();
  const deleteMutation = useDeleteSede();

  const [formData, setFormData] = useState({
    nombreSede: '',
    contact: '',
    departamento: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    Status: 'Active'
  });

  // Datos memoizados para evitar re-renders innecesarios
  const sedes = useMemo(() => data?.data || [], [data?.data]);

  // Funciones memoizadas para evitar re-creación en cada render
  const resetForm = useCallback(() => {
    setFormData({
      nombreSede: '',
      contact: '',
      departamento: '',
      telefono: '',
      ciudad: '',
      direccion: '',
      Status: 'Active'
    });
    setEditingSede(null);
  }, []);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((sede: Sede) => {
    setFormData({
      nombreSede: sede.nombreSede || '',
      contact: sede.contact || '',
      departamento: sede.departamento || '',
      telefono: sede.telefono || '',
      ciudad: sede.ciudad || '',
      direccion: sede.direccion || '',
      Status: sede.Status || 'Active'
    });
    setEditingSede(sede);
    setShowModal(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  }, [editingSede, updateMutation, createMutation, customerId, formData, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!sedeToDelete) return;

    try {
      await deleteMutation.mutateAsync(sedeToDelete._id!);
      setShowDeleteModal(false);
      setSedeToDelete(null);
    } catch (error) {
      console.error('Error al eliminar sede:', error);
    }
  }, [sedeToDelete, deleteMutation]);

  const openDeleteModal = useCallback((sede: Sede) => {
    setSedeToDelete(sede);
    setShowDeleteModal(true);
  }, []);

  // Loading temprano para evitar renderizado innecesario
  if (!customerId || isLoading) {
    return (
      <div className="p-4 text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  // Eliminar código duplicado ya que lo movimos arriba
  // const sedes = data?.data || []; // Ya está memoizado arriba

  return (
    <div className="p-4">
      {/*{String(error) && (
        <Alert variant="danger" className="mb-3">
          Error al cargar las sedes del cliente. Puedes crear una nueva sede.
        </Alert>
      )*/}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          Sedes ({sedes.length})
        </h5>
        <Button 
          variant="primary" 
          size="sm"
          onClick={openCreateModal}
        >
          + Agregar Sede
        </Button>
      </div>

      {sedes.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h6>No hay sedes registradas</h6>
          <p className="mb-3">Agrega la primera sede para este cliente.</p>
          <Button variant="primary" onClick={openCreateModal}>
            Crear Primera Sede
          </Button>
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Nombre de la Sede</th>
                <th>Ciudad</th>
                <th>Departamento</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th className="text-center" style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map((sede) => (
                <tr key={sede._id}>
                  <td>
                    <div>
                      <strong>{sede.nombreSede}</strong>
                      {sede.contact && (
                        <div className="text-muted small">
                          Contacto: {sede.contact}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{sede.ciudad || 'N/A'}</td>
                  <td>{sede.departamento || 'N/A'}</td>
                  <td>{sede.telefono || 'N/A'}</td>
                  <td>
                    <Badge bg={sede.Status === 'Active' ? 'success' : 'secondary'}>
                      {sede.Status || 'N/A'}
                    </Badge>
                  </td>
                  <td>
                    <Dropdown align="end">
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Acciones
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => openEditModal(sede)}>
                          Editar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={() => openDeleteModal(sede)}
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

      {/* Modal Crear/Editar Sede */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
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
                editingSede ? 'Actualizar' : 'Crear'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        show={showDeleteModal}
        title="Confirmar eliminación"
        body={`¿Eliminar la sede "${sedeToDelete?.nombreSede}"?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default CustomerSedesSection;