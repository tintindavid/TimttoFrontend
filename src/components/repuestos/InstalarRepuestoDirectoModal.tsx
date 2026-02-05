import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaWrench, FaCalendarAlt } from 'react-icons/fa';
import { CreateRepuestoSolicitudDto } from '@/types/repuesto.types';
import { useCreateRepuestoSolicitud } from '@/hooks/useRepuestos';
import { useAuth } from '@/context/AuthContext';

interface InstalarRepuestoDirectoModalProps {
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
});

export const InstalarRepuestoDirectoModal: React.FC<InstalarRepuestoDirectoModalProps> = ({
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
      origenRepuesto: 'Inventario',
      PrecioRepuesto: 0,
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
    console.log('DEBUG Instalar - userId final:', userId);
    
    if (!userId) {
      alert('Error: Usuario no autenticado. Verifique que ha iniciado sesión correctamente.');
      return;
    }
    try {
      setLoading(true);
      
      // Crear el repuesto con los datos básicos de solicitud
      const repuestoData: CreateRepuestoSolicitudDto = {
        ...data,
        ResponsableSolicitud: userId,
      };

      await createRepuestoMutation.mutateAsync({
        reporteId,
        otId,
        equipoId,
        data: repuestoData
      });

      reset();
      onHide();
    } catch (error) {
      console.error('Error al instalar repuesto directamente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaWrench className="me-2" />
          Instalar Repuesto Directamente
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          {!!createRepuestoMutation.error && (
            <Alert variant="danger">
              Error al instalar el repuesto
            </Alert>
          )}

          <Alert variant="info" className="mb-4">
            <strong>Instalación Directa:</strong> Este repuesto se registrará como instalado inmediatamente 
            sin pasar por el proceso de solicitud-aprobación.
          </Alert>

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
                <Form.Label>Cantidad Instalada *</Form.Label>
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Origen del Repuesto</Form.Label>
                <Controller
                  name="origenRepuesto"
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field}>
                      <option value="Inventario">Inventario</option>
                      <option value="Compra">Compra</option>
                      <option value="Garantia">Garantía</option>
                      <option value="Donacion">Donación</option>
                    </Form.Select>
                  )}
                />
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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Precio</Form.Label>
                <Controller
                  name="PrecioRepuesto"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      isInvalid={!!errors.PrecioRepuesto}
                    />
                  )}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.PrecioRepuesto?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Moneda</Form.Label>
                <Controller
                  name="Currency"
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field}>
                      <option value="COP">COP - Peso Colombiano</option>
                      <option value="USD">USD - Dólar</option>
                      <option value="EUR">EUR - Euro</option>
                    </Form.Select>
                  )}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Observaciones de Instalación</Form.Label>
            <Controller
              name="observacion"
              control={control}
              render={({ field }) => (
                <Form.Control
                  {...field}
                  as="textarea"
                  rows={3}
                  placeholder="Detalles sobre la instalación, problemas encontrados, etc."
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
            variant="success" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Instalando...' : 'Registrar como Instalado'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};