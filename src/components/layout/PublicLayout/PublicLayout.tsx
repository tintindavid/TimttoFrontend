import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';

/**
 * Minimal layout for the public ticket app (`/public/ticket/:qrToken`).
 * Intentionally has no sidebar, no panel topbar, and no auth guard — the
 * sessionToken issued by `validate-access` lives in sessionStorage only.
 */
const PublicLayout: React.FC = () => {
  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: '#f5f7fb' }}
    >
      <header className="bg-white border-bottom py-3">
        <Container>
          <h5 className="m-0 text-primary">Timtto · Tickets</h5>
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

export default PublicLayout;
