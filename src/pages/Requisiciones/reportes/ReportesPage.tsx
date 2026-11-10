import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, Container, Nav } from 'react-bootstrap';
import { useHasPermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import ReqHelp from '../help/ReqHelp';
import MetricasTab from './MetricasTab';
import TableroTab from './TableroTab';

type ReportesTab = 'tablero' | 'metricas';

/** `/requisiciones/reportes`: dashboard for everyone, metrics only with `requisiciones:reports`. */
const ReportesPage: React.FC = () => {
  const canReport = useHasPermission(PERMISSIONS.REQUISICIONES_REPORTS);
  const [tab, setTab] = useState<ReportesTab>('tablero');
  const activeTab: ReportesTab = tab === 'metricas' && canReport ? 'metricas' : 'tablero';

  return (
    <Container fluid>
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/requisiciones' }}>
          Requisiciones
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Reportes</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="mb-1">
        Reportes
        <ReqHelp id="pagina.reportes" placement="bottom" />
      </h1>
      <p className="text-muted">Tablero de pendientes y métricas del módulo de requisiciones</p>

      <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(key) => setTab(key === 'metricas' ? 'metricas' : 'tablero')}>
        <Nav.Item>
          <Nav.Link eventKey="tablero">Tablero</Nav.Link>
        </Nav.Item>
        {canReport && (
          <Nav.Item>
            <Nav.Link eventKey="metricas">Métricas</Nav.Link>
          </Nav.Item>
        )}
      </Nav>

      {activeTab === 'tablero' ? <TableroTab /> : <MetricasTab />}
    </Container>
  );
};

export default ReportesPage;
