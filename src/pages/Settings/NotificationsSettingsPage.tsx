import React from 'react';
import { Container, Tab, Tabs } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import NotificationRulesTab from '@/components/notifications/NotificationRulesTab';
import NotificationPreferencesTab from '@/components/notifications/NotificationPreferencesTab';

const NotificationsSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Container>
      <h1>Notificaciones — Configuración</h1>
      <p className="text-muted mb-4">Administra las reglas de notificación del tenant y tus preferencias personales.</p>

      <Tabs defaultActiveKey={isAdmin ? 'rules' : 'preferences'} className="mb-3">
        {isAdmin && (
          <Tab eventKey="rules" title="Reglas">
            <NotificationRulesTab />
          </Tab>
        )}
        <Tab eventKey="preferences" title="Mis preferencias">
          <NotificationPreferencesTab />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default NotificationsSettingsPage;
