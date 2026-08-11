import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';

interface Props {
  reason?: 'expired' | 'revoked' | 'superseded' | 'not_found';
}

const COPY: Record<NonNullable<Props['reason']>, { title: string; body: string }> = {
  expired: {
    title: 'Este enlace ha expirado',
    body: 'El enlace de firma ya no es válido. Contacta a tu ejecutivo de cuenta para que te envíe uno nuevo.',
  },
  revoked: {
    title: 'Este enlace fue revocado',
    body: 'El acceso al documento fue cancelado por el equipo de TIMTTO. Contacta a tu ejecutivo si necesitas firmarlo nuevamente.',
  },
  superseded: {
    title: 'Este enlace fue reemplazado',
    body: 'La hoja de trabajo fue firmada en sitio, por lo que este enlace ya no es válido. Comunícate con el equipo de TIMTTO si necesitas una copia.',
  },
  not_found: {
    title: 'Enlace no encontrado',
    body: 'El enlace no existe o fue eliminado. Verifica que la dirección sea correcta.',
  },
};

const RemoteSignExpired: React.FC<Props> = ({ reason = 'expired' }) => {
  const { title, body } = COPY[reason];
  return (
    <div className="d-flex justify-content-center py-5">
      <Card style={{ maxWidth: 480, width: '100%' }}>
        <Card.Body className="p-4 text-center">
          <FaBan size={40} className="text-danger mb-3" />
          <Alert variant="danger" className="mb-0">
            <h5 className="mb-2">{title}</h5>
            <div className="small">{body}</div>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RemoteSignExpired;
