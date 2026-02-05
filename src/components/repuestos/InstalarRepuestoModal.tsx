import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaWrench, FaCalendarAlt } from 'react-icons/fa';
import { InstalarRepuestoDto, Repuesto } from '@/types/repuesto.types';
import { useInstalarRepuesto } from '@/hooks/useRepuestos';
import { useAuth } from '@/context/AuthContext';

interface InstalarRepuestoModalProps {
  show: boolean;
  onHide: () => void;
  repuesto: Repuesto;
  reporteId: string;
}

const schema = yup.object().shape({
  CantidadInstalacion: yup.number()
    .min(1, 'La cantidad debe ser mayor a 0')
    .required('La cantidad instalada es obligatoria'),
  ObservacionInstalacion: yup.string().optional(),
});

export const InstalarRepuestoModal: React.FC<InstalarRepuestoModalProps> = ({
  show,
  onHide,
  repuesto,
  reporteId
}) => {
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const instalarRepuestoMutation = useInstalarRepuesto();

  console.log('InstalarRepuestoModal - user:', user);
  console.log('InstalarRepuestoModal - token:', token);
  console.log('InstalarRepuestoModal - isAuthenticated:', isAuthenticated);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<Omit<InstalarRepuestoDto, '_id' | 'FechaInstalacion' | 'ResponsableInstalacion'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      CantidadInstalacion: 1,
      ObservacionInstalacion: '',
    }
  });

  useEffect(() => {
    if (show && repuesto) {
      // Resetear el formulario cuando se abre el modal
      reset({
        CantidadInstalacion: 1,
        ObservacionInstalacion: '',
      });
    }
  }, [show, repuesto, reset]);

  const onSubmit = async (formData: Omit<InstalarRepuestoDto, '_id' | 'FechaInstalacion' | 'ResponsableInstalacion'>) => {
    console.log('DEBUG Instalar Modal - user:', user);
    console.log('DEBUG Instalar Modal - user?._id:', user?._id);
    console.log('DEBUG Instalar Modal - token:', token);
    
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
    console.log('DEBUG Instalar Modal - userId final:', userId);
    
    if (!userId) {
      alert('Error: Usuario no autenticado. Verifique que ha iniciado sesión correctamente.');
      return;
    }

    if (!repuesto._id) {
      alert('Error: ID del repuesto no válido');
      return;
    }

    try {
      setLoading(true);
      const data: InstalarRepuestoDto = {
        _id: repuesto._id,
        CantidadInstalacion: formData.CantidadInstalacion,
        FechaInstalacion: new Date(),
        ObservacionInstalacion: formData.ObservacionInstalacion,
        ResponsableInstalacion: userId
      };

      await instalarRepuestoMutation.mutateAsync({ data, reporteId });
      reset();
      onHide();
    } catch (error) {
      console.error('Error al instalar repuesto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  const cantidadSolicitada = parseInt(repuesto.Cantidad || '0');

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaWrench className="me-2" />
          Instalar Repuesto
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {!!instalarRepuestoMutation.error && (
            <Alert variant="danger">
              Error al instalar el repuesto
            </Alert>
          )}

          {/* Información del repuesto */}
          <Alert variant="info" className="mb-4">
            <h6 className="mb-3">Información de la Solicitud</h6>
            <Row>
              <Col md={6}>
                <p><strong>Repuesto:</strong> {repuesto.nombre}</p>
                <p><strong>Cantidad Solicitada:</strong> {repuesto.Cantidad}</p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Estado:</strong>{' '}
                  <Badge bg="warning">{repuesto.EstadoSolicitud}</Badge>
                </p>
                <p>
                  <strong>Prioridad:</strong>{' '}
                  <Badge bg={repuesto.Prioridad === 'Alta' || repuesto.Prioridad === 'Critica' ? 'danger' : 
                            repuesto.Prioridad === 'Media' ? 'warning' : 'secondary'}>
                    {repuesto.Prioridad}
                  </Badge>
                </p>
              </Col>
            </Row>
            {repuesto.observacion && (
              <div className="mt-2">
                <strong>Observación de la solicitud:</strong>
                <p className="mb-0 text-muted">{repuesto.observacion}</p>
              </div>
            )}
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Cantidad a Instalar *</Form.Label>
                <Controller
                  name="CantidadInstalacion"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="1"
                      max={cantidadSolicitada}
                      placeholder="Cantidad a instalar"
                      isInvalid={!!errors.CantidadInstalacion}
                    />
                  )}
                />
                <Form.Text className="text-muted">
                  Máximo: {cantidadSolicitada} unidades
                </Form.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.CantidadInstalacion?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Instalación</Form.Label>
                <Form.Control
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                />
                <Form.Text className="text-muted">
                  <FaCalendarAlt className="me-1" />
                  Se registrará automáticamente
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones de Instalación</Form.Label>
            <Controller
              name="ObservacionInstalacion"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as="textarea"
                  rows={4}
                  placeholder="Detalles sobre la instalación, problemas encontrados, etc."
                />
              )}
            />
          </Form.Group>

          <Alert variant="warning" className="mb-0">
            <strong>Importante:</strong> Al confirmar la instalación, el estado del repuesto 
            cambiará a "Instalado" y se registrará la fecha y responsable de la instalación.
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Instalando...' : 'Confirmar Instalación'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};