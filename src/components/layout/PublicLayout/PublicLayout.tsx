import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
// requerir la imagen del logo de TimttoFrontend\src\img\logo-extended.png
import logoExtended from '../../../img/logo-extended.png';

/**
 * Minimal layout shared by every public, no-panel-auth app: the ticket QR
 * flow (`/public/ticket/:qrToken`) and the equipment-history QR flow
 * (`/public/equipo/:qrToken`, `equipment-qr-public-history` D7).
 * Intentionally has no sidebar, no panel topbar, and no auth guard.
 */
const PublicLayout: React.FC = () => {
  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: '#f5f7fb' }}
    >
      <header className="bg-white border-bottom py-3">
        <Container>  {/**aqui va la foto C:\Users\marti\OneDrive\Documents\TIMTTO\TimttoFrontend\src\img\logo-extended.png o la simplificada dependiendo de la pantalla */}
          <img
            src={logoExtended}
            alt="Timtto Logo"
            className="me-2"
            style={{ height: '40px', width: 'auto' }}
          />
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
