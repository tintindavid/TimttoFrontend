import React from 'react';
import { Navbar as BSNavbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import logoExtended from '@/img/logo-extended.png';
import logoSimplified from '@/img/logo-simplified.png';
import './Navbar.css';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  /** The side menu is in compact mode (desktop): the brand shows the simplified logo over the strip. */
  sidebarCompacto?: boolean;
  /** Switches the side menu between fixed and compact on desktop. When absent the desktop button is not shown. */
  onToggleSidebarModo?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, sidebarCompacto = false, onToggleSidebarModo }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (eventKey: string | null) => {
    if (eventKey === 'profile') {
      navigate('/profile');
    } else if (eventKey === 'logout') {
      logout();
    }
  };

  return (
    <BSNavbar expand="lg" className={`tt-navbar ${sidebarCompacto ? 'tt-navbar-compacto' : ''}`.trim()} variant="dark">
      <Container fluid>
        {/* brand-logos-wiring v3: on mobile the simplified logo sits
            flush in the top-left corner and the hamburger lives
            immediately to its right. On desktop the hamburger is hidden
            (`d-lg-none`) and the extended logo fills the sidebar rail. */}
        <BSNavbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
          {/* Responsive brand mark (brand-logos-wiring, design D3): both
              images stay mounted; Bootstrap `d-lg-*` classes swap visibility
              at 992px so there's no flash on resize and no JS media-query.
              Extended width is locked to the sidebar rail via Navbar.css. */}
          <img src={logoExtended} alt="Timtto" className={`navbar-logo-extended d-none ${sidebarCompacto ? '' : 'd-lg-inline-block'}`.trim()} />
          <img src={logoSimplified} alt="Timtto" className={`navbar-logo-simplified d-inline-block ${sidebarCompacto ? '' : 'd-lg-none'}`.trim()} />
        </BSNavbar.Brand>

        {/* Botón hamburguesa para móviles — se renderiza DESPUÉS del brand
            para que, en mobile, el logo quede en la esquina izquierda y el
            hamburger a su lado derecho. */}
        <Button
          variant="link"
          className="text-white d-lg-none p-0 ms-2 me-2 border-0"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menú"
        >
          <FaBars size={24} />
        </Button>

        {/* Desktop: switches the side menu between fixed and compact. The mobile button above is not touched. */}
        {onToggleSidebarModo && (
          <Button
            variant="link"
            className="text-white d-none d-lg-inline-flex p-0 ms-3 me-2 border-0"
            onClick={onToggleSidebarModo}
            aria-label={sidebarCompacto ? 'Expandir menú' : 'Contraer menú'}
            aria-pressed={sidebarCompacto}
            title={sidebarCompacto ? 'Expandir menú' : 'Contraer menú'}
          >
            {sidebarCompacto ? <FaAngleDoubleRight size={22} /> : <FaAngleDoubleLeft size={22} />}
          </Button>
        )}

        <BSNavbar.Toggle />
        <BSNavbar.Collapse className="justify-content-end">
          <Nav className="align-items-center">
            <span className="navbar-text me-3 d-none d-md-block">{user?.tenantId || ''}</span>
            <NotificationBell />
            <NavDropdown title={user?.fullName || user?.email || 'Cuenta'} id="user-menu" align="end" onSelect={handleSelect}>
              <NavDropdown.Item eventKey="profile">Perfil</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item eventKey="logout">Cerrar sesión</NavDropdown.Item>
            </NavDropdown>
            <Button variant="outline-light" size="sm" className="ms-3 d-none d-md-inline" onClick={logout}>Salir</Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
