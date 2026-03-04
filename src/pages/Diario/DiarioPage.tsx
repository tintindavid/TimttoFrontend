import React, { useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { FaBook, FaClipboardList, FaTools } from 'react-icons/fa';
import HojasTrabajoTab from './HojasTrabajoTab';
import ReportesCerradosTab from './ReportesCerradosTab';
import './DiarioPage.css';

/**
 * Página Diario
 * Contiene dos tabs:
 * - Tab 1: Hojas de Trabajo (todas las worksheets)
 * - Tab 2: Reportes Cerrados (reportes de mantenimiento cerrados)
 */
const DiarioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('hojas-trabajo');

  return (
    <Container fluid className="diario-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex align-items-center mb-2">
          <FaBook className="text-primary me-2" size={32} />
          <div>
            <h1 className="mb-0">Diario de Trabajo</h1>
            <p className="text-muted mb-0">
              Gestión de hojas de trabajo y reportes cerrados
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        id="diario-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'hojas-trabajo')}
        className="mb-4"
      >
        {/* Tab 1: Hojas de Trabajo */}
        <Tab
          eventKey="hojas-trabajo"
          title={
            <span>
              <FaClipboardList className="me-2" />
              Hojas de Trabajo
            </span>
          }
        >
          <HojasTrabajoTab />
        </Tab>

        {/* Tab 2: Reportes Cerrados */}
        <Tab
          eventKey="reportes-cerrados"
          title={
            <span>
              <FaTools className="me-2" />
              Reportes Cerrados
            </span>
          }
        >
          <ReportesCerradosTab />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default DiarioPage;
