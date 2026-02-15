import React, { useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { FaUser, FaGlobe, FaCalendarAlt } from 'react-icons/fa';
import { CronogramaPorCliente } from './CronogramaPorCliente';
import { CronogramaGeneral } from './CronogramaGeneral';
import './Cronograma.css';

/**
 * Página principal de Cronogramas de Mantenimiento
 * Contiene dos tabs:
 * - Tab 1: Cronograma por Cliente (con creación de OT)
 * - Tab 2: Cronograma General (solo visualización)
 */
const CronogramasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('por-cliente');

  return (
    <Container fluid className="cronogramas-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex align-items-center mb-2">
          <FaCalendarAlt className="text-primary me-2" size={32} />
          <div>
            <h1 className="mb-0">Cronogramas de Mantenimiento</h1>
            <p className="text-muted mb-0">
              Gestión de cronogramas y programación de mantenimientos
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        id="cronogramas-tabs"
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'por-cliente')}
        className="mb-4"
      >
        {/* Tab 1: Por Cliente */}
        <Tab
          eventKey="por-cliente"
          title={
            <span>
              <FaUser className="me-2" />
              Por Cliente
            </span>
          }
        >
          <CronogramaPorCliente />
        </Tab>

        {/* Tab 2: General */}
        <Tab
          eventKey="general"
          title={
            <span>
              <FaGlobe className="me-2" />
              Cronograma General
            </span>
          }
        >
          <CronogramaGeneral />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default CronogramasPage;
