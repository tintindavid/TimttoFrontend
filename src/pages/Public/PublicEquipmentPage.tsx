import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab, Tabs } from 'react-bootstrap';
import { usePublicEquipmentByToken } from '@/hooks/usePublicEquipment';
import PublicEquipmentHeader from '@/components/public/PublicEquipmentHeader';
import PublicEquipmentInfoGrid from '@/components/public/PublicEquipmentInfoGrid';
import PublicMaintenanceHistoryTab from '@/components/public/PublicMaintenanceHistoryTab';
import PublicEquipmentSkeleton from '@/components/public/PublicEquipmentSkeleton';
import PublicEquipmentNotFound from './PublicEquipmentNotFound';

type TabKey = 'mtto';

/**
 * `/public/equipo/:qrToken` — mobile-first, read-only equipment history
 * (D7, D16). Orchestrates header + info grid + Tabs (default "Mtto").
 */
const PublicEquipmentPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const [tab, setTab] = useState<TabKey>('mtto');

  const { data, isLoading, isError } = usePublicEquipmentByToken(qrToken);

  if (isLoading) {
    return <PublicEquipmentSkeleton />;
  }

  if (isError || !data?.data) {
    return <PublicEquipmentNotFound />;
  }

  const payload = data.data;

  return (
    <div className="pb-4">
      <PublicEquipmentHeader equipo={payload.equipo} cliente={payload.cliente} sede={payload.sede} />
      <PublicEquipmentInfoGrid equipo={payload.equipo} historial={payload.historial} />

      <div className="px-3">
        <Tabs activeKey={tab} onSelect={(k) => k && setTab(k as TabKey)} className="mb-2">
          <Tab eventKey="mtto" title="Mtto">
            <PublicMaintenanceHistoryTab historial={payload.historial} />
          </Tab>
        </Tabs>
      </div>

      <footer className="text-center small text-muted py-3">
        Powered by TIMTTO
      </footer>
    </div>
  );
};

export default PublicEquipmentPage;
