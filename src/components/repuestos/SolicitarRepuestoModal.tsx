import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaPlus } from 'react-icons/fa';
import { CreateRepuestoSolicitudDto, PrioridadRepuesto, OrigenRepuesto } from '@/types/repuesto.types';
import { useCreateRepuestoSolicitud } from '@/hooks/useRepuestos';
import { useAuth } from '@/context/AuthContext';

interface SolicitarRepuestoModalProps {
  show: boolean;
  onHide: () => void;
  reporteId: string;
  otId: string;
  equipoId: string;
}

const schema = yup.object().shape({
  nombre: yup.string().required('El nombre del repuesto es obligatorio'),
  Cantidad: yup.string().required('La cantidad es obligatoria'),
  Currency: yup.string().optional(),
  observacion: yup.string().optional(),
  origenRepuesto: yup.string().optional(),
  PrecioRepuesto: yup.number().min(0, 'El precio no puede ser negativo').optional(),
  Prioridad: yup.string().optional(),
});

export const SolicitarRepuestoModal: React.FC<SolicitarRepuestoModalProps> = ({
  show,
  onHide,
  reporteId,
  otId,
  equipoId
}) => {
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const createRepuestoMutation = useCreateRepuestoSolicitud();
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<Omit<CreateRepuestoSolicitudDto, 'ResponsableSolicitud'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      Cantidad: '',
      Currency: 'COP',
      observacion: '',
      origenRepuesto: '',
      PrecioRepuesto: 0,
      Prioridad: 'Media',
    }
  });

  const onSubmit = async (data: Omit<CreateRepuestoSolicitudDto, 'ResponsableSolicitud'>) => {

    
    // Función para extraer userId del token JWT como fallback
    const getUserIdFromToken = (token: string): string | null => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.id || payload.sub;
      } catch (error) {
        console.error('Error parsing token:', error);
        return null;
      }
    };
    
    const userId = user?._id || (token ? getUserIdFromToken(token) : null);
    console.log('DEBUG - userId final:', userId);
    
    if (!userId) {
      alert('Error: Usuario no autenticado. Verifique que ha iniciado sesión correctamente.');
      return;
    }

    try {
      setLoading(true);
      await createRepuestoMutation.mutateAsync({
        reporteId,
        otId,
        equipoId,
        data: {
          ...data,
          ResponsableSolicitud: userId
        }
      });
      reset();
      onHide();
    } catch (error) {
      console.error('Error al crear solicitud de repuesto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  const prioridadOptions: PrioridadRepuesto[] = ['Baja', 'Media', 'Alta', 'Critica'];
  const origenOptions: OrigenRepuesto[] = ['Inventario', 'Compra', 'Garantia', 'Donacion','Cliente'];

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaPlus className="me-2" />
          Solicitar Repuesto
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {!!createRepuestoMutation.error && (
            <Alert variant="danger">
              Error al crear la solicitud de repuesto
            </Alert>
          )}

          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Repuesto *</Form.Label>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: Filtro de aceite, Bomba hidráulica..."
                      isInvalid={!!errors.nombre}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nombre?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Cantidad *</Form.Label>
                <Controller
                  name="Cantidad"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="text"
                      placeholder="Ej: 2, 1 unidad..."
                      isInvalid={!!errors.Cantidad}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.Cantidad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Prioridad *</Form.Label>
                <Controller
                  name="Prioridad"
                  control={control}
                  render={({ field }) => (
                    <Form.Select
                      {...field}
                      isInvalid={!!errors.Prioridad}
                    >
                      {prioridadOptions.map(prioridad => (
                        <option key={prioridad} value={prioridad}>
                          {prioridad}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.Prioridad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Observaciones</Form.Label>
            <Controller
              name="observacion"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as="textarea"
                  rows={3}
                  placeholder="Detalles adicionales sobre el repuesto, especificaciones, etc."
                />
              )}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Solicitud'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};