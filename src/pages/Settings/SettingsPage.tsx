import React from 'react';
import { Container, Card } from 'react-bootstrap';

const SettingsPage: React.FC = () => {
  return (
    <Container>
      <h1>Configuración</h1>
      <p className="text-muted">Ajustes generales de la aplicación</p>
      <Card className="tt-card">
        <Card.Body>
          <div className="text-muted">Página de configuración (placeholder)</div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SettingsPage;
