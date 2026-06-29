import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { usePublicSession } from '@/hooks/usePublicTicket';
import { publicSessionStorage } from '@/services/publicTicket.service';
import PublicCreateTicketForm from './components/PublicCreateTicketForm';
import PublicTicketsList from './components/PublicTicketsList';

type TabKey = 'create' | 'mine';

const PublicTicketDashboard: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('create');

  const sessionQuery = usePublicSession();

  useEffect(() => {
    if (!publicSessionStorage.getToken()) {
      navigate(`/public/ticket/${qrToken}`, { replace: true });
    }
  }, [navigate, qrToken]);

  const handleLogout = (): void => {
    publicSessionStorage.clear();
    navigate(`/public/ticket/${qrToken}`, { replace: true });
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (sessionQuery.isError) {
    return (
      <Alert variant="danger">
        Sesión inválida o expirada. Vuelva a ingresar la contraseña.
        <div className="mt-2">
          <Button size="sm" variant="outline-primary" onClick={handleLogout}>
            Volver al ingreso
          </Button>
        </div>
      </Alert>
    );
  }

  const session = sessionQuery.data?.data;

  return (
    <>
      <Card className="mb-3">
        <Card.Body className="py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div className="small text-muted">Servicio</div>
              <h5 className="m-0">{session?.servicio?.name || '—'}</h5>
              <div className="small text-muted mt-1">
                <Badge bg="light" text="dark" className="me-1">{session?.cliente?.name || '—'}</Badge>
                <Badge bg="light" text="dark">{session?.sede?.name || '—'}</Badge>
              </div>
            </div>
            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
              <FaSignOutAlt className="me-1" />
              Salir
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Tabs activeKey={tab} onSelect={(k) => k && setTab(k as TabKey)} className="mb-3">
        <Tab eventKey="create" title="Crear Ticket">
          <PublicCreateTicketForm />
        </Tab>
        <Tab eventKey="mine" title="Mis Solicitudes">
          <PublicTicketsList />
        </Tab>
      </Tabs>
    </>
  );
};

export default PublicTicketDashboard;
