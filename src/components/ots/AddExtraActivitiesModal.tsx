import React, { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Form,
  ListGroup,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useActividades, useCreateActividad } from '@/hooks/useActividades';
import { useAddExtraActividades } from '@/hooks/useReportes';
import { useDebounce } from '@/hooks/useDebounce';
import { useHasPermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { Reporte } from '@/types/reporte.types';
import AppPagination from '@/components/common/Pagination';

interface AddExtraActivitiesModalProps {
  show: boolean;
  onHide: () => void;
  reporteId: string;
  /** `_id`s of activities that already belong to the item's protocol — disabled + tooltip. */
  protocoloActividadIds: string[];
  /** `_id`s of catalog activities already added as extras on this report — disabled + tooltip. */
  extrasYaAgregadasIds: string[];
  onSuccess: (reporteActualizado: Reporte) => void;
}

const PAGE_LIMIT = 20;

const AddExtraActivitiesModal: React.FC<AddExtraActivitiesModalProps> = ({
  show,
  onHide,
  reporteId,
  protocoloActividadIds,
  extrasYaAgregadasIds,
  onSuccess,
}) => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');

  const canCreateActividad = useHasPermission(PERMISSIONS.ACTIVIDAD_MTTO_CREATE);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reset all local state every time the modal is (re)opened so stale
  // selections/search from a previous session never leak in.
  useEffect(() => {
    if (show) {
      setPage(1);
      setSearchTerm('');
      setSelected(new Set());
      setShowCreatePanel(false);
      setNewNombre('');
      setNewDescripcion('');
    }
  }, [show]);

  const listQuery = useActividades({
    page,
    limit: PAGE_LIMIT,
    search: debouncedSearch.trim() || undefined,
  });
  const createMutation = useCreateActividad();
  const addExtrasMutation = useAddExtraActividades();

  const actividades = listQuery.data?.data ?? [];
  const totalPages = listQuery.data?.pagination?.pages ?? 1;

  const toggleSelected = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleCreateNueva = async () => {
    const nombre = newNombre.trim();
    if (!nombre) return;

    const duplicate = actividades.some(
      (a) => (a.Nombre || '').trim().toLowerCase() === nombre.toLowerCase()
    );
    if (duplicate) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: 'Nombre repetido',
        text: `Ya existe una actividad llamada "${nombre}" en el catálogo. ¿Deseas crearla de todas formas?`,
        showCancelButton: true,
        confirmButtonText: 'Sí, crear de todas formas',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f0ad4e',
      });
      if (!confirmation.isConfirmed) return;
    }

    try {
      const response = await createMutation.mutateAsync({
        Nombre: nombre,
        Descripcion: newDescripcion.trim() || undefined,
      });
      const createdId = response.data?._id;
      if (createdId) {
        setSelected((prev) => new Set(prev).add(createdId));
      }
      setNewNombre('');
      setNewDescripcion('');
      setShowCreatePanel(false);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo crear la actividad',
        text: err?.response?.data?.message || 'Ocurrió un error inesperado.',
        confirmButtonColor: '#d33',
      });
    }
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    try {
      const response = await addExtrasMutation.mutateAsync({
        reporteId,
        actividadMttoIds: Array.from(selected),
      });
      onSuccess(response.data);
      onHide();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudieron agregar las actividades',
        text: err?.response?.data?.message || 'Ocurrió un error inesperado.',
        confirmButtonColor: '#d33',
      });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar actividades del catálogo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="add-extra-activities-search" visuallyHidden>
            Buscar actividad
          </Form.Label>
          <Form.Control
            id="add-extra-activities-search"
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Buscar actividad"
          />
        </Form.Group>

        {canCreateActividad && (
          <div className="mb-3">
            {!showCreatePanel ? (
              <Button
                variant="link"
                size="sm"
                className="p-0"
                onClick={() => setShowCreatePanel(true)}
              >
                + Crear nueva actividad
              </Button>
            ) : (
              <div className="border rounded p-3 bg-light">
                <Form.Group className="mb-2">
                  <Form.Label htmlFor="new-actividad-nombre">Nombre</Form.Label>
                  <Form.Control
                    id="new-actividad-nombre"
                    type="text"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label htmlFor="new-actividad-descripcion">Descripción (opcional)</Form.Label>
                  <Form.Control
                    id="new-actividad-descripcion"
                    as="textarea"
                    rows={2}
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                  />
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!newNombre.trim() || createMutation.isLoading}
                    onClick={handleCreateNueva}
                  >
                    {createMutation.isLoading ? 'Creando...' : 'Crear'}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setShowCreatePanel(false);
                      setNewNombre('');
                      setNewDescripcion('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {listQuery.isLoading && (
          <div className="d-flex justify-content-center my-4">
            <Spinner animation="border" />
          </div>
        )}

        {listQuery.isError && !listQuery.isLoading && (
          <Alert variant="danger">Error al cargar el catálogo de actividades.</Alert>
        )}

        {!listQuery.isLoading && !listQuery.isError && (
          <>
            {actividades.length === 0 ? (
              <Alert variant="info">No se encontraron actividades</Alert>
            ) : (
              <ListGroup
                className="mb-3"
                style={{ maxHeight: '320px', overflowY: 'auto' }}
              >
                {actividades.map((actividad) => {
                  const id = actividad._id as string;
                  const inProtocolo = protocoloActividadIds.includes(id);
                  const yaEsExtra = extrasYaAgregadasIds.includes(id);
                  const disabled = inProtocolo || yaEsExtra;
                  const tooltipText = inProtocolo
                    ? 'Ya está en el protocolo del ítem'
                    : 'Ya está agregada como extra';

                  const checkbox = (
                    <Form.Check
                      type="checkbox"
                      id={`extra-activity-${id}`}
                      label={
                        <div>
                          <strong>{actividad.Nombre}</strong>
                          {actividad.Descripcion && (
                            <small className="text-muted d-block">{actividad.Descripcion}</small>
                          )}
                        </div>
                      }
                      checked={selected.has(id)}
                      disabled={disabled}
                      onChange={(e) => toggleSelected(id, e.target.checked)}
                    />
                  );

                  return (
                    <ListGroup.Item
                      key={id}
                      className={disabled ? 'bg-light text-muted' : undefined}
                    >
                      {disabled ? (
                        <OverlayTrigger
                          placement="left"
                          overlay={<Tooltip id={`tooltip-extra-${id}`}>{tooltipText}</Tooltip>}
                        >
                          <span className="d-inline-block w-100">{checkbox}</span>
                        </OverlayTrigger>
                      ) : (
                        checkbox
                      )}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}

            {totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <AppPagination page={page} pages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          disabled={selected.size === 0 || addExtrasMutation.isLoading}
          onClick={handleSubmit}
        >
          {addExtrasMutation.isLoading
            ? 'Agregando...'
            : `Agregar seleccionadas (${selected.size})`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddExtraActivitiesModal;
