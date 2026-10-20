import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import type { TenantCapability } from '@/types';

interface RequireCapabilityProps {
  capability: TenantCapability;
  children: React.ReactNode;
}

const NOTICE_ID = 'capability-disabled-notice';

/**
 * Route guard: renders children when the tenant has the capability (or while the
 * capabilities are loading), otherwise redirects home with a Spanish notice.
 * The backend is authoritative; this only avoids dead-end screens.
 */
const RequireCapability: React.FC<RequireCapabilityProps> = ({ capability, children }) => {
  const { can, isLoading } = useTenantCapabilities();
  const allowed = isLoading || can(capability);

  useEffect(() => {
    if (!allowed) {
      toast.info('Este módulo no está disponible para tu organización.', { toastId: NOTICE_ID });
    }
  }, [allowed]);

  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RequireCapability;
