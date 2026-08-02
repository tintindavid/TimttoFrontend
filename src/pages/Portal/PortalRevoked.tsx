import React from 'react';
import { Alert, Card } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';

interface PortalRevokedProps {
  revokedAt?: string | null;
}

const formatDate = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '';
  }
};

/**
 * Rendered when the public consolidated view responds with HTTP 410 — per
 * "Client opens the portal with a revoked token" scenario. MUST NOT show
 * any client or OT data; only the revocation message and date.
 */
const PortalRevoked: React.FC<PortalRevokedProps> = ({ revokedAt }) => {
  const formatted = formatDate(revokedAt);

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ maxWidth: 480, width: '100%' }}>
        <Card.Body className="p-4 text-center">
          <FaBan size={40} className="text-danger mb-3" />
          <Alert variant="danger" className="mb-0">
            <h5 className="mb-2">Este acceso fue revocado</h5>
            {formatted && (
              <div className="small">Revocado el {formatted}.</div>
            )}
            <div className="small mt-2">
              Contacte a su ejecutivo de cuenta para solicitar un nuevo acceso.
            </div>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PortalRevoked;
