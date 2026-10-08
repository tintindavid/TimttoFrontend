import React from 'react';
import { Placeholder } from 'react-bootstrap';

/**
 * Shimmer skeleton shown while `usePublicEquipmentByToken` is in flight
 * (D16 — CSR, no SSR, so we need a fast first paint).
 */
const PublicEquipmentSkeleton: React.FC = () => {
  return (
    <div aria-label="Cargando" role="status">
      <div className="bg-white border-bottom py-3 px-3">
        <Placeholder as="div" animation="glow">
          <Placeholder xs={6} size="lg" />
          <Placeholder xs={4} />
        </Placeholder>
      </div>
      <div className="px-3 py-3">
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} size="lg" className="mb-2" />
          <Placeholder xs={8} className="mb-2" />
          <Placeholder xs={10} className="mb-2" />
          <Placeholder xs={6} />
        </Placeholder>
      </div>
    </div>
  );
};

export default PublicEquipmentSkeleton;
