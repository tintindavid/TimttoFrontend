import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';

interface Props {
  reason?: 'exhausted' | 'expired' | 'revoked' | 'not_found';
}

const COPY: Record<NonNullable<Props['reason']>, { title: string; body: string }> = {
  exhausted: {
    title: 'Este enlace ya no tiene descargas disponibles',
    body: 'Se alcanzó el límite de descargas para este enlace. Contacta al equipo de TIMTTO para recibir un nuevo enlace.',
  },
  expired: {
    title: 'Este enlace ha expirado',
    body: 'El enlace de descarga ya no es válido. Contacta al equipo de TIMTTO para recibir un nuevo enlace.',
  },
  revoked: {
    title: 'Este enlace fue revocado',
    body: 'El acceso a esta Hoja de Trabajo fue cancelado. Contacta al equipo de TIMTTO si necesitas descargarla nuevamente.',
  },
  not_found: {
    title: 'Enlace no encontrado',
    body: 'El enlace no existe o fue eliminado. Verifica que la dirección sea correcta.',
  },
};

const SheetDownloadExhausted: React.FC<Props> = ({ reason = 'exhausted' }) => {
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

export default SheetDownloadExhausted;
