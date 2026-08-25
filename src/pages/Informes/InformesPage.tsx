import React, { useCallback, useMemo } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

import { InformesPorMesTab } from './tabs/InformesPorMesTab';
import { InformesPorOtTab } from './tabs/InformesPorOtTab';

type InformesTabKey = 'meses' | 'ot';

const DEFAULT_TAB: InformesTabKey = 'meses';

function toTabKey(value: string | null): InformesTabKey {
  return value === 'ot' ? 'ot' : DEFAULT_TAB;
}

/**
 * Thin shell for `/informes` — two tabs, active tab synced to `?tab=meses|ot`
 * (informe-por-ot spec: "Default tab is meses when the param is missing or
 * invalid").
 */
export const InformesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => toTabKey(searchParams.get('tab')), [searchParams]);

  const handleSelect = useCallback(
    (key: string | null) => {
      const next = toTabKey(key);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('tab', next);
        return params;
      });
    },
    [setSearchParams],
  );

  return (
    <Tabs activeKey={activeTab} onSelect={handleSelect} className="px-3 pt-3" mountOnEnter unmountOnExit>
      <Tab eventKey="meses" title="Informe por meses">
        <InformesPorMesTab />
      </Tab>
      <Tab eventKey="ot" title="Informe por OT">
        <InformesPorOtTab />
      </Tab>
    </Tabs>
  );
};

export default InformesPage;
