import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useUser, useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { TIPO_CONTRATO_OPTIONS, TipoContrato } from '@/types/user.types';
import Swal from 'sweetalert2';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  roleId: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  tipoContrato: TipoContrato;
  salario: string;
}

const emptyState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  roleId: '',
  fechaNacimiento: '',
  fechaIngreso: '',
  tipoContrato: '',
  salario: '',
};

const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: userResponse, isLoading: loadingUser } = useUser(id || '');
  const { data: rolesResponse, isLoading: loadingRoles } = useRoles({ page: 1, limit: 100 });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const roles = rolesResponse?.data || [];
  const [form, setForm] = useState<FormState>(emptyState);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const user = userResponse?.data;
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      roleId: user.roleId || '',
      fechaNacimiento: user.fechaNacimiento ? String(user.fechaNacimiento).slice(0, 10) : '',
      fechaIngreso: user.fechaIngreso ? String(user.fechaIngreso).slice(0, 10) : '',
      tipoContrato: user.tipoContrato || '',
      salario: user.salario != null ? String(user.salario) : '',
    });
  }, [isEdit, userResponse]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.roleId) {
      setError('Debe asignar un rol al usuario para que pueda operar el sistema.');
      return;
    }

    const payload: Record<string, unknown> = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      city: form.city || undefined,
      roleId: form.roleId,
      fechaNacimiento: form.fechaNacimiento || null,
      fechaIngreso: form.fechaIngreso || null,
      tipoContrato: form.tipoContrato || '',
      salario: form.salario === '' ? null : Number(form.salario),
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        navigate('/users');
      } else {
        // Backend now generates a temp password and emails it; the frontend
        // never asks for one on create. The API returns `emailSent` +
        // `temporaryPassword` so the operator has a fallback if delivery fails.
        const response = await createMutation.mutateAsync(payload as never);
        const result = (response as any)?.data;
        const emailSent = result?.emailSent;
        const tempPassword = result?.temporaryPassword;

        if (tempPassword) {
          await Swal.fire({
            icon: 'success',
            title: 'Usuario creado',
            html: emailSent
              ? `Se envió una contraseña temporal al correo <strong>${form.email}</strong>.<br/><br/>Si no llega en 5 min, comparte manualmente: <code>${tempPassword}</code>`
              : `No fue posible enviar el correo. Comparte manualmente esta contraseña temporal: <code>${tempPassword}</code>`,
            confirmButtonText: 'Entendido',
          });
        }
        navigate('/users');
      }
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.message;
      setError(backendMessage || 'No fue posible guardar el usuario.');
    }
  };

  if (isEdit && loadingUser) {
    return (
      <Container className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="mb-4">{isEdit ? 'Editar Usuario' : 'Crear Usuario'}</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {!isEdit && (
        <Alert variant="info" className="d-flex align-items-start gap-2">
          <div>
            El sistema genera automáticamente una <strong>contraseña temporal</strong> y la envía al correo del usuario.
            En el primer inicio de sesión, se le pedirá cambiarla.
          </div>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="tt-card mb-3">
          <Card.Body>
            <h6 className="mb-3 text-muted text-uppercase">Datos personales</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Nombres</Form.Label>
                <Form.Control value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required maxLength={100} />
              </Col>
              <Col md={6}>
                <Form.Label>Apellidos</Form.Label>
                <Form.Control value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required maxLength={100} />
              </Col>
              <Col md={6}>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  disabled={isEdit}
                />
                {isEdit && <Form.Text className="text-muted">El email no se puede cambiar después de crear el usuario.</Form.Text>}
              </Col>
              <Col md={6}>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>Fecha de nacimiento</Form.Label>
                <Form.Control
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => update('fechaNacimiento', e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Ciudad</Form.Label>
                <Form.Control value={form.city} onChange={(e) => update('city', e.target.value)} />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="tt-card mb-3">
          <Card.Body>
            <h6 className="mb-3 text-muted text-uppercase">Datos laborales</h6>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Fecha de ingreso</Form.Label>
                <Form.Control
                  type="date"
                  value={form.fechaIngreso}
                  onChange={(e) => update('fechaIngreso', e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Form.Label>Tipo de contrato</Form.Label>
                <Form.Select
                  value={form.tipoContrato}
                  onChange={(e) => update('tipoContrato', e.target.value as TipoContrato)}
                >
                  <option value="">— Seleccionar —</option>
                  {TIPO_CONTRATO_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Salario</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1000}
                  value={form.salario}
                  onChange={(e) => update('salario', e.target.value)}
                  placeholder="0"
                />
                <Form.Text className="text-muted">
                  Ingresa el salario <strong>total</strong>, incluyendo todas las prestaciones sociales (cesantías, primas,
                  vacaciones, aportes) y beneficios extralegales.
                </Form.Text>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="tt-card mb-3">
          <Card.Body>
            <Form.Label className="fw-semibold">Rol y permisos</Form.Label>
            <Form.Text className="d-block mb-2">
              El rol determina qué acciones puede realizar el usuario en el sistema. Los permisos se configuran en el módulo <strong>Roles</strong>.
            </Form.Text>
            <Form.Select
              value={form.roleId}
              onChange={(e) => update('roleId', e.target.value)}
              disabled={loadingRoles}
              required
            >
              <option value="">— Seleccionar rol —</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                  {role.description ? ` — ${role.description}` : ''}
                </option>
              ))}
            </Form.Select>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
            {(createMutation.isLoading || updateMutation.isLoading) && (
              <Spinner as="span" size="sm" animation="border" className="me-2" />
            )}
            {isEdit ? 'Actualizar' : 'Crear y enviar credenciales'}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} type="button">
            Cancelar
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default UserFormPage;
