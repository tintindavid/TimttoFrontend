import React from 'react';
import { FaQrcode } from 'react-icons/fa';

/**
 * Friendly 404 for an unknown / inactive / soft-deleted token. No
 * stacktrace, no technical detail, and no link back into the private app
 * (spec scenario "Invalid token").
 */
const PublicEquipmentNotFound: React.FC = () => {
  return (
    <div className="text-center py-5 px-3">
      <FaQrcode className="fs-1 text-muted mb-3" aria-hidden="true" />
      <h5>No encontramos este equipo</h5>
      <p className="text-muted mb-0">
        El código QR no es válido o ya no está activo. Si cree que esto es un error,
        comuníquese con el coordinador de mantenimiento.
      </p>
    </div>
  );
};

export default PublicEquipmentNotFound;
