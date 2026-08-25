import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBell, FaChevronRight } from 'react-icons/fa';

interface SettingItem {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SETTINGS: SettingItem[] = [
  {
    to: '/settings/notifications',
    icon: <FaBell size={22} />,
    title: 'Notificaciones',
    description: 'Reglas del tenant (admin) y preferencias personales por evento.',
  },
];

const SettingsPage: React.FC = () => {
  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ color: '#1a2332' }}>Configuración</h1>
        <p className="text-muted mb-0">Ajustes de la aplicación y de tu cuenta.</p>
      </div>

      <Row className="g-3">
        {SETTINGS.map((s) => (
          <Col md={6} lg={4} key={s.to}>
            <Card
              as={Link}
              to={s.to}
              className="h-100 text-decoration-none tt-card"
              style={{ color: 'inherit', transition: 'transform 0.15s, box-shadow 0.15s' }}
            >
              <Card.Body className="d-flex align-items-start">
                <div
                  className="me-3 d-flex align-items-center justify-content-center"
                  style={{ width: 44, height: 44, borderRadius: 8, background: '#eef2f7', color: '#1a2332', flexShrink: 0 }}
                >
                  {s.icon}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold mb-1" style={{ color: '#1a2332' }}>{s.title}</div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{s.description}</div>
                </div>
                <FaChevronRight className="text-muted ms-2" style={{ flexShrink: 0, marginTop: 4 }} />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default SettingsPage;
