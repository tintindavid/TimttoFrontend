import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Container,
  Card,
  Spinner,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Badge,
  Modal,
  InputGroup
} from 'react-bootstrap';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import Swal from 'sweetalert2';

import { useProtocol, useCreateProtocol, useUpdateProtocol } from '@/hooks/useProtocols';
import { useActividades, useCreateActividad } from '@/hooks/useActividades';

import type { ActividadMtto, CreateActividadDto } from '@/types/actividad.types';
import type { CreateProtocolDto, UpdateProtocolDto } from '@/types/protocol.types';

/* =========================
   Tipos locales del Form
========================= */

interface ProtocolFormState {
  nombre: string;
  Descripcion: string;
  actividadesMtto: string[]; // 👈 SOLO IDS
}

const ProtocolFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  /* =========================
     Queries / Mutations
  ========================= */

  const { data: protocolData, isLoading: loadingProtocol } = useProtocol(id ?? '');

  const {
    data: actividadesResponse,
    isLoading: loadingActividades,
    error: errorActividades,
    refetch: refetchActividades
  } = useActividades(
    { page: 1, limit: 100 },
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false
    }
  );

  const createMutation = useCreateProtocol();
  const updateMutation = useUpdateProtocol();
  const createActividadMutation = useCreateActividad();

  /* =========================
     State
  ========================= */

  const [formData, setFormData] = useState<ProtocolFormState>({
    nombre: '',
    Descripcion: '',
    actividadesMtto: []
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showActividadModal, setShowActividadModal] = useState(false);
  
  // Estados para filtros y ordenamiento de actividades
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form para crear actividad
  const { 
    register: registerActividad, 
    handleSubmit: handleSubmitActividad, 
    formState: formStateActividad, 
    reset: resetActividad 
  } = useForm<CreateActividadDto>({ 
    defaultValues: { 
      Nombre: '', 
      Descripcion: '', 
      EsObligatoria: false 
    } 
  });

  /* =========================
     Datos derivados
  ========================= */

  const actividades: ActividadMtto[] = useMemo(
    () => actividadesResponse?.data ?? [],
    [actividadesResponse]
  );

  // Actividades filtradas y ordenadas
  const actividadesFiltradas = useMemo(() => {
    let result = [...actividades];

    // Filtrar por búsqueda (nombre o descripción)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(actividad => 
        actividad.Nombre?.toLowerCase().includes(query) ||
        actividad.Descripcion?.toLowerCase().includes(query)
      );
    }

    // Ordenar por nombre (inicial)
    result.sort((a, b) => {
      const nameA = a.Nombre?.toUpperCase() || '';
      const nameB = b.Nombre?.toUpperCase() || '';
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return result;
  }, [actividades, searchQuery, sortOrder]);

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  /* =========================
     Inicializar form al editar
  ========================= */

useEffect(() => {
  if (isEdit && protocolData?.data) {
    setFormData({
      nombre: protocolData.data.nombre ?? '',
      Descripcion: protocolData.data.Descripcion ?? '',
      actividadesMtto: protocolData.data.actividadesMtto
        ? protocolData.data.actividadesMtto
            .map(act => act._id)
            .filter((id): id is string => Boolean(id))
        : []
    });
  }
}, [isEdit, protocolData]);


  /* =========================
     Handlers
  ========================= */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleActividadToggle = (actividadId: string) => {
    setFormData(prev => ({
      ...prev,
      actividadesMtto: prev.actividadesMtto.includes(actividadId)
        ? prev.actividadesMtto.filter(id => id !== actividadId)
        : [...prev.actividadesMtto, actividadId]
    }));
  };

  const handleCreateActividad = async (values: CreateActividadDto) => {
    try {
      await createActividadMutation.mutateAsync(values);
      
      // Refetch actividades
      await refetchActividades();
      
      // Cerrar modal y resetear form
      setShowActividadModal(false);
      resetActividad();
      
      // Notificación de éxito
      Swal.fire({
        icon: 'success',
        title: 'Actividad creada',
        text: 'La actividad se ha creado exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la actividad',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  /* =========================
     Validación
  ========================= */

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.nombre.trim()) {
      errors.push('El nombre del protocolo es obligatorio');
    }

    if (actividades.length === 0) {
      errors.push('Debe existir al menos una actividad registrada');
    }

    if (formData.actividadesMtto.length === 0) {
      errors.push('Seleccione al menos una actividad');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  /* =========================
     Submit
  ========================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: CreateProtocolDto | UpdateProtocolDto = {
      nombre: formData.nombre,
      Descripcion: formData.Descripcion,
      actividadesMtto: formData.actividadesMtto
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        
        Swal.fire({
          icon: 'success',
          title: 'Protocolo actualizado',
          text: 'El protocolo se ha actualizado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await createMutation.mutateAsync(payload);
        
        Swal.fire({
          icon: 'success',
          title: 'Protocolo creado',
          text: 'El protocolo se ha creado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

      navigate('/protocols');
    } catch (error) {
      console.error('Error al guardar protocolo:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo ${isEdit ? 'actualizar' : 'crear'} el protocolo`,
        confirmButtonText: 'Aceptar'
      });
    }
  };

  /* =========================
     Loading / Errors
  ========================= */

  if (isEdit && loadingProtocol) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
      </div>
    );
  }

  if (loadingActividades) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" />
        <span className="ms-2">Cargando actividades...</span>
      </div>
    );
  }

  if (errorActividades) {
    return <Alert variant="danger">Error al cargar actividades</Alert>;
  }

  /* =========================
     Render
  ========================= */

  return (
    <Container>
      <Card className="tt-card">
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-center">
            <span>{isEdit ? 'Editar Protocolo' : 'Crear Protocolo'}</span>
            <Badge bg="info">
              {formData.actividadesMtto.length} actividades seleccionadas
            </Badge>
          </Card.Title>

          {validationErrors.length > 0 && (
            <Alert variant="danger">
              <ul className="mb-0">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre del protocolo"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Descripcion"
                    value={formData.Descripcion}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Actividades *</Form.Label>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowActividadModal(true)}
                  type="button"
                >
                  + Crear actividad
                </Button>
              </div>
              
              {/* Filtros y ordenamiento */}
              <Row className="mb-3">
                <Col md={8}>
                  <InputGroup size="sm">
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Buscar por nombre o descripción..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text>
                      {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                    </InputGroup.Text>
                    <Form.Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                      <option value="asc">A-Z (Ascendente)</option>
                      <option value="desc">Z-A (Descendente)</option>
                    </Form.Select>
                  </InputGroup>
                </Col>
              </Row>
              
              <div className="border rounded p-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
                <Row>
                  {actividadesFiltradas.length === 0 ? (
                    <Col className="text-center text-muted py-3">
                      <p className="mb-0">
                        {searchQuery ? 'No se encontraron actividades con ese criterio de búsqueda' : 'No hay actividades disponibles'}
                      </p>
                    </Col>
                  ) : (
                    actividadesFiltradas.map(actividad => (
                    <Col md={6} lg={4} key={actividad._id} className="mb-2">
                    <Form.Check
                      type="checkbox"
                      checked={actividad._id ? formData.actividadesMtto.includes(actividad._id) : false}
                      onChange={() => actividad._id && handleActividadToggle(actividad._id)}
                        label={
                          <>
                            <strong>{actividad.Nombre}</strong>
                            {actividad.Descripcion && (
                              <div className="text-muted small">
                                {actividad.Descripcion}
                              </div>
                            )}
                          </>
                        }
                      />
                    </Col>
                  ))
                  )}
                </Row>
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner animation="border" size="sm" className="me-2" />}
                {isSubmitting
                  ? isEdit
                    ? 'Actualizando...'
                    : 'Creando...'
                  : isEdit
                  ? 'Actualizar'
                  : 'Crear Protocolo'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Modal para crear actividad */}
      <Modal show={showActividadModal} onHide={() => setShowActividadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear Nueva Actividad</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitActividad(handleCreateActividad)}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control 
                {...registerActividad('Nombre', { required: true })} 
                placeholder="Nombre de la actividad"
                isInvalid={!!formStateActividad.errors.Nombre}
              />
              {formStateActividad.errors.Nombre && (
                <Form.Control.Feedback type="invalid">
                  El nombre es obligatorio
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                {...registerActividad('Descripcion')} 
                placeholder="Descripción de la actividad" 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Es obligatoria" 
                {...registerActividad('EsObligatoria')} 
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowActividadModal(false);
                  resetActividad();
                }}
                disabled={formStateActividad.isSubmitting || createActividadMutation.isLoading}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={formStateActividad.isSubmitting || createActividadMutation.isLoading}
              >
                {(formStateActividad.isSubmitting || createActividadMutation.isLoading) && (
                  <Spinner animation="border" size="sm" className="me-2" />
                )}
                {formStateActividad.isSubmitting || createActividadMutation.isLoading ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProtocolFormPage;
