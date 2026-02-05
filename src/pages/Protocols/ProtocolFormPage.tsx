import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Spinner,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Badge
} from 'react-bootstrap';

import { useProtocol, useCreateProtocol, useUpdateProtocol } from '@/hooks/useProtocols';
import { useActividades } from '@/hooks/useActividades';

import type { ActividadMtto } from '@/types/actividad.types';
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
    error: errorActividades
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

  /* =========================
     State
  ========================= */

  const [formData, setFormData] = useState<ProtocolFormState>({
    nombre: '',
    Descripcion: '',
    actividadesMtto: []
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /* =========================
     Datos derivados
  ========================= */

  const actividades: ActividadMtto[] = useMemo(
    () => actividadesResponse?.data ?? [],
    [actividadesResponse]
  );

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
      } else {
        await createMutation.mutateAsync(payload);
      }

      navigate('/protocols');
    } catch (error) {
      console.error('Error al guardar protocolo:', error);
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
              <Form.Label>Actividades *</Form.Label>

              <div className="border rounded p-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
                <Row>
                  {actividades.map(actividad => (
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
                  ))}
                </Row>
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEdit
                    ? 'Actualizando...'
                    : 'Creando...'
                  : isEdit
                  ? 'Actualizar'
                  : 'Crear'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProtocolFormPage;
