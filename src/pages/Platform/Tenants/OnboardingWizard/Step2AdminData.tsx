import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Row, Col, Button, Alert } from 'react-bootstrap';
import type { WizardFormData } from '@/types';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const schema = yup.object({
  email: yup.string().email('Email inválido').required('El email es requerido'),
  firstName: yup
    .string()
    .required('El nombre es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  lastName: yup
    .string()
    .required('El apellido es requerido')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
});

type Step2FormData = yup.InferType<typeof schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Step2Props {
  defaultValues?: Partial<WizardFormData['admin']>;
  onNext: (data: WizardFormData['admin']) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Step2AdminData: React.FC<Step2Props> = ({ defaultValues, onNext, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2FormData>({
    resolver: yupResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  const onSubmit = (data: Step2FormData) => {
    onNext({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h5 className="mb-3">Paso 2 — Datos del primer administrador</h5>

      <Alert variant="info" className="mb-4">
        <strong>Nota:</strong> El backend generará una contraseña temporal segura y la devolverá
        una sola vez al completar el wizard. El administrador deberá cambiarla en su primer
        acceso.
      </Alert>

      <Row className="g-3">
        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>
              Nombre <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control
              {...register('firstName')}
              isInvalid={!!errors.firstName}
              placeholder="Nombre"
            />
            <Form.Control.Feedback type="invalid">
              {errors.firstName?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>
              Apellido <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control
              {...register('lastName')}
              isInvalid={!!errors.lastName}
              placeholder="Apellido"
            />
            <Form.Control.Feedback type="invalid">
              {errors.lastName?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12}>
          <Form.Group>
            <Form.Label>
              Email <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              {...register('email')}
              isInvalid={!!errors.email}
              placeholder="admin@empresa.com"
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        {/* Read-only password hint field */}
        <Col xs={12}>
          <Form.Group>
            <Form.Label>Contraseña temporal</Form.Label>
            <Form.Control
              type="text"
              value="(generada automáticamente por el backend)"
              disabled
              readOnly
              aria-readonly="true"
            />
            <Form.Text muted>
              Se mostrará una sola vez al finalizar el wizard.
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-4">
        <Button variant="secondary" onClick={onBack}>
          ← Anterior
        </Button>
        <Button type="submit" variant="primary">
          Siguiente →
        </Button>
      </div>
    </Form>
  );
};

export default Step2AdminData;
