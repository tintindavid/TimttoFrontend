import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Row, Col, Button } from 'react-bootstrap';
import type { WizardFormData } from '@/types';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const buildSchema = (requireOrgData: boolean) => yup.object({
  tenantId: yup
    .string()
    .required('El ID del tenant es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .matches(
      /^[a-z0-9-]+$/,
      'Solo letras minúsculas, números y guiones. Sin espacios.'
    )
    .test(
      'not-reserved',
      'El ID "__platform__" está reservado',
      (val) => val !== '__platform__'
    ),
  name: yup.string().required('El nombre es requerido').min(2).max(200),
  slogan: yup.string().optional(),
  direccion: yup.string().optional(),
  email: requireOrgData
    ? yup.string().required('El email es requerido para organizaciones cliente').email('Email inválido')
    : yup
        .string()
        .email('Email inválido')
        .transform((val: string) => (val === '' ? undefined : val))
        .optional(),
  telefono: requireOrgData
    ? yup.string().trim().required('El teléfono es requerido para organizaciones cliente')
    : yup.string().optional(),
  nit: requireOrgData
    ? yup.string().trim().required('El NIT es requerido para organizaciones cliente')
    : yup.string().optional(),
  ciudad: requireOrgData
    ? yup.string().trim().required('La ciudad es requerida para organizaciones cliente')
    : yup.string().optional(),
  departamento: requireOrgData
    ? yup.string().trim().required('El departamento es requerido para organizaciones cliente')
    : yup.string().optional(),
  pais: yup.string().optional(),
  website: yup
    .string()
    .transform((val: string) => (val === '' ? undefined : val))
    .url('URL inválida')
    .optional(),
});

type Step1FormData = yup.InferType<ReturnType<typeof buildSchema>>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Step1Props {
  defaultValues?: Partial<WizardFormData['tenant']>;
  onNext: (data: WizardFormData['tenant']) => void;
  onBack?: () => void;
  /** Client organizations need NIT, city, department, email and phone to build their organization client. */
  requireOrgData?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Step1TenantData: React.FC<Step1Props> = ({
  defaultValues,
  onNext,
  onBack,
  requireOrgData = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1FormData>({
    resolver: yupResolver(buildSchema(requireOrgData)),
    defaultValues: defaultValues ?? {},
  });

  const onSubmit = (data: Step1FormData) => {
    onNext({
      tenantId: data.tenantId,
      name: data.name,
      slogan: data.slogan,
      direccion: data.direccion,
      email: data.email,
      telefono: data.telefono,
      nit: data.nit,
      ciudad: data.ciudad,
      departamento: data.departamento,
      pais: data.pais,
      website: data.website,
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h5 className="mb-4">Paso 2 — Datos del tenant</h5>

      <Row className="g-3">
        {/* Required fields */}
        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>
              ID del tenant <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control
              {...register('tenantId')}
              isInvalid={!!errors.tenantId}
              placeholder="ej. mi-empresa-sas"
              aria-describedby="tenantId-help"
            />
            <Form.Text id="tenantId-help" muted>
              Solo letras minúsculas, números y guiones. No se puede cambiar después.
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              {errors.tenantId?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>
              Nombre de la empresa <span aria-hidden="true">*</span>
            </Form.Label>
            <Form.Control
              {...register('name')}
              isInvalid={!!errors.name}
              placeholder="Nombre comercial"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        {/* Optional fields */}
        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>Email de contacto {requireOrgData && <span aria-hidden="true"> *</span>}</Form.Label>
            <Form.Control
              type="email"
              {...register('email')}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>Teléfono {requireOrgData && <span aria-hidden="true"> *</span>}</Form.Label>
            <Form.Control {...register('telefono')} isInvalid={!!errors.telefono} />
            <Form.Control.Feedback type="invalid">
              {errors.telefono?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>NIT {requireOrgData && <span aria-hidden="true"> *</span>}</Form.Label>
            <Form.Control {...register('nit')} isInvalid={!!errors.nit} placeholder="900.123.456-7" />
            <Form.Control.Feedback type="invalid">
              {errors.nit?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>Dirección</Form.Label>
            <Form.Control {...register('direccion')} />
          </Form.Group>
        </Col>

        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label>Ciudad {requireOrgData && <span aria-hidden="true"> *</span>}</Form.Label>
            <Form.Control {...register('ciudad')} isInvalid={!!errors.ciudad} />
            <Form.Control.Feedback type="invalid">
              {errors.ciudad?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label>Departamento {requireOrgData && <span aria-hidden="true"> *</span>}</Form.Label>
            <Form.Control {...register('departamento')} isInvalid={!!errors.departamento} />
            <Form.Control.Feedback type="invalid">
              {errors.departamento?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label>País</Form.Label>
            <Form.Control {...register('pais')} defaultValue="Colombia" />
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>Sitio web</Form.Label>
            <Form.Control
              type="url"
              {...register('website')}
              isInvalid={!!errors.website}
              placeholder="https://www.ejemplo.com"
            />
            <Form.Control.Feedback type="invalid">
              {errors.website?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group>
            <Form.Label>Slogan</Form.Label>
            <Form.Control {...register('slogan')} placeholder="Tagline opcional" />
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-between mt-4">
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            ← Anterior
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary">
          Siguiente →
        </Button>
      </div>
    </Form>
  );
};

export default Step1TenantData;
