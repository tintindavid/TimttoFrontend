import React, { useState, useMemo, useCallback } from 'react';
import { 
  Card, Button, Table, Badge, Spinner, Alert, Dropdown 
} from 'react-bootstrap';
import { 
  useSedesByCustomer, 
  useDeleteSede 
} from '@/hooks/useSedes';
import { Sede } from '@/types/sede.types';
import ConfirmModal from '@/components/common/ConfirmModal';
import SedeFormModal from './SedeFormModal';

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
  const deleteMutation = useDeleteSede();

  // Datos memoizados para evitar re-renders innecesarios
  const sedes = useMemo(() => data?.data || [], [data?.data]);

  // Funciones memoizadas para evitar re-creación en cada render
  const openCreateModal = useCallback(() => {
    setEditingSede(null);
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((sede: Sede) => {
    setEditingSede(sede);
    setShowModal(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    // El modal se cierra automáticamente y React Query invalida el cache
  }, []);

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
      <SedeFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        customerId={customerId}
        editingSede={editingSede}
        onSuccess={handleFormSuccess}
      />

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