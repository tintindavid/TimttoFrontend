import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';
import { DEMO_STATUS_KEY, useDemoStatus } from '@/hooks/useDemoStatus';

/** Strip with the limits and current usage of a demo account. Renders nothing for regular tenants. */
const DemoBanner: React.FC = () => {
  const { isDemo, limits, usage } = useDemoStatus();
  const queryClient = useQueryClient();

  // Any successful change may create or remove users, clients or equipment: refresh the counters.
  useEffect(() => {
    if (!isDemo) return undefined;
    return queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'updated' && event.mutation?.state.status === 'success') {
        queryClient.invalidateQueries([DEMO_STATUS_KEY]);
      }
    });
  }, [isDemo, queryClient]);

  if (!isDemo) return null;

  return (
    <Alert variant="info" className="py-2 small" role="status">
      <strong>Cuenta de demostración.</strong>{' '}
      Usuarios {usage.users}/{limits.users} · Clientes {usage.customers}/{limits.customers} · Equipos{' '}
      {usage.equipos}/{limits.equipos}. Cada documento se puede descargar {limits.pdfPerDocument} veces en PDF, con
      marca de agua; máximo {limits.reportsPerOt ?? 5} reportes de
      servicio por orden de trabajo.
    </Alert>
  );
};

export default DemoBanner;
