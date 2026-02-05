import React from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User } from '@/types/user.types';
import { useUpdateProfile } from '@/hooks/useUsers';
import { toast } from 'react-toastify';

interface EditProfileModalProps {
  show: boolean;
  onHide: () => void;
  user: User;
  onSuccess: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  registroInvima?: string;
}

const schema: yup.ObjectSchema<ProfileFormData> = yup.object({
  firstName: yup.string().required('El nombre es obligatorio').min(2, 'Mínimo 2 caracteres'),
  lastName: yup.string().required('El apellido es obligatorio').min(2, 'Mínimo 2 caracteres'),
  phone: yup.string().optional(),
  city: yup.string().optional(),
  registroInvima: yup.string().optional(),
});

const EditProfileModal: React.FC<EditProfileModalProps> = ({ show, onHide, user, onSuccess }) => {
  const { mutate: updateProfile, isLoading } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      city: user.city || '',
      registroInvima: user.registroInvima || '',
    },
  });

  React.useEffect(() => {
    if (show) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        city: user.city || '',
        registroInvima: user.registroInvima || '',
      });
    }
  }, [show, user, reset]);

  const onSubmit: SubmitHandler<ProfileFormData> = (data) => {
    updateProfile(
      {
        id: user._id || '',
        data,
      },
      {
        onSuccess: () => {
          toast.success('Perfil actualizado correctamente');
          onSuccess();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Error al actualizar el perfil');
        },
      }
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Perfil</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body>
          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>
                  Nombre <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  {...register('firstName')}
                  isInvalid={!!errors.firstName}
                  placeholder="Ingrese su nombre"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.firstName?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label>
                  Apellido <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  {...register('lastName')}
                  isInvalid={!!errors.lastName}
                  placeholder="Ingrese su apellido"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastName?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  {...register('phone')}
                  isInvalid={!!errors.phone}
                  placeholder="+57 300 123 4567"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phone?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  {...register('city')}
                  isInvalid={!!errors.city}
                  placeholder="Ciudad de residencia"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.city?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Registro INVIMA</Form.Label>
            <Form.Control
              type="text"
              {...register('registroInvima')}
              isInvalid={!!errors.registroInvima}
              placeholder="Número de registro INVIMA"
            />
            <Form.Control.Feedback type="invalid">
              {errors.registroInvima?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Alert variant="info" className="mb-0">
            <small>
              <strong>Nota:</strong> Para cambiar tu email o contraseña, contacta al administrador del sistema.
            </small>
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
