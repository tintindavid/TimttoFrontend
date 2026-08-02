import React from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { usePortalConsolidated } from '@/hooks/portal/usePortalData';

/**
 * Minimal responsive layout for the public client portal (`/portal/:token/*`).
 * No admin sidebar, no auth guard — the opaque token in the URL is the only
 * credential. Shows the tenant logo and client name when the consolidated
 * query resolves successfully; falls back to a generic header on error
 * (unknown/revoked token) so no client data leaks into the chrome either.
 */
const PortalLayout: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const { data } = usePortalConsolidated(token);
  const view = data?.data;
  const isHistorial = location.pathname.endsWith('/historial');

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f5f7fb' }}>
      <header className="bg-white border-bottom py-3">
        <Container className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {view?.tenant?.logoUrl ? (
              <img
                src={view.tenant.logoUrl}
                alt={`Logo de ${view.tenant.name}`}
                style={{ height: 40, width: 'auto' }}
              />
            ) : null}
            <div>
              <h5 className="m-0 text-primary">{view?.tenant?.name || 'Timtto · Portal cliente'}</h5>
              {view?.cliente?.name && (
                <div className="small text-muted">{view.cliente.name}</div>
              )}
            </div>
          </div>
          {token && (
            <div>
              {isHistorial ? (
                <Link to={`/portal/${token}`}>Volver al listado</Link>
              ) : (
                <Link to={`/portal/${token}/historial`}>Ver historial</Link>
              )}
            </div>
          )}
        </Container>
      </header>
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <footer className="text-center small text-muted py-3">
        Timtto &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default PortalLayout;
