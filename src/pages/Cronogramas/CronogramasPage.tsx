import React, { useState } from 'react';
import { Container, Tabs, Tab, Spinner } from 'react-bootstrap';
import { FaUser, FaGlobe, FaCalendarAlt } from 'react-icons/fa';
import { CronogramaPorCliente } from './CronogramaPorCliente';
import { CronogramaGeneral } from './CronogramaGeneral';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import './Cronograma.css';

/**
 * Página principal de Cronogramas de Mantenimiento
 * Contiene dos tabs:
 * - Tab 1: Cronograma por Cliente (con creación de OT), o "Mi Cronograma" para una organización cliente
 * - Tab 2: Cronograma General (solo mantenimiento preventivo, solo visualización)
 */
const CronogramasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('por-cliente');
  const { can, organizationCustomerId, isLoading } = useTenantCapabilities();

  // A client organization or an own-maintenance tenant (does not manage customers and has its own client) sees "Mi Cronograma" with
  // its own client already selected; every other tenant keeps "Por Cliente" with the client selector.
  const clienteFijoId = !can('managesCustomers') && organizationCustomerId ? organizationCustomerId : undefined;

  // Capabilities default to "everything enabled" while they load; rendering the tabs then would show the client
  // selector for a client organization and keep its state when the real value arrives.
  if (isLoading) {
    return (
      <Container fluid className="cronogramas-page py-4 text-center">
        <Spinner animation="border" role="status" aria-label="Cargando cronograma" />
      </Container>
    );
  }

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
              {clienteFijoId ? 'Mi Cronograma' : 'Por Cliente'}
            </span>
          }
        >
          {/* key: the selected client is initialised from clienteFijoId, so a change (view-as, late capabilities) remounts it */}
          <CronogramaPorCliente key={clienteFijoId ?? 'selector'} clienteFijoId={clienteFijoId} />
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
