import React from 'react';
import { Alert, Card, Form, Spinner, Table } from 'react-bootstrap';
import { useNotificationEvents } from '@/hooks/useNotificationRules';
import { useNotificationPreferences, useUpsertNotificationPreference } from '@/hooks/useNotificationPreferences';

const NotificationPreferencesTab: React.FC = () => {
  const { data: eventsResponse, isLoading: eventsLoading } = useNotificationEvents();
  const { data: preferencesResponse, isLoading: preferencesLoading, isError } = useNotificationPreferences();
  const upsertMutation = useUpsertNotificationPreference();

  const events = eventsResponse?.data || [];
  const preferences = preferencesResponse?.data || [];

  const isMuted = (event: string) =>
    preferences.some((pref) => pref.event === event && pref.mutedChannels.includes('inapp'));

  const handleToggleInapp = (event: string, muted: boolean) => {
    upsertMutation.mutate({ event, mutedChannels: muted ? ['inapp'] : [] });
  };

  const isLoading = eventsLoading || preferencesLoading;

  return (
    <div>
      {isLoading && (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" variant="primary" aria-label="Cargando preferencias" />
        </div>
      )}

      {isError && <Alert variant="danger">No fue posible cargar tus preferencias.</Alert>}

      {!isLoading && !isError && (
        <Card className="tt-card">
          <Card.Body>
            {events.length === 0 ? (
              <p className="text-center text-muted my-3 mb-0">No hay eventos configurables todavía.</p>
            ) : (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>In-app</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const muted = isMuted(event);
                    return (
                      <tr key={event}>
                        <td>{event}</td>
                        <td>
                          <Form.Check
                            type="switch"
                            id={`pref-inapp-${event}`}
                            checked={!muted}
                            onChange={(e) => handleToggleInapp(event, !e.target.checked)}
                            aria-label={`Recibir ${event} por in-app`}
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="switch"
                            id={`pref-email-${event}`}
                            checked={false}
                            disabled
                            title="Disponible próximamente"
                            aria-label={`Recibir ${event} por email (disponible próximamente)`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default NotificationPreferencesTab;
