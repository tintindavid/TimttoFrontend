import React from 'react';
import { Navbar as BSNavbar, Container, Nav, NavDropdown, Button, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Navbar: React.FC = () => {
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
    <BSNavbar expand="lg" className="tt-navbar" variant="dark">
      <Container fluid>
        <BSNavbar.Brand onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="d-flex align-items-center">
          <Image src="/logo192.png" alt="Timtto" height={32} className="me-2" />
          <span className="fw-bold">TIMTTO</span>
        </BSNavbar.Brand>

        <BSNavbar.Toggle />
        <BSNavbar.Collapse className="justify-content-end">
          <Nav className="align-items-center">
            <span className="navbar-text me-3 d-none d-md-block">{user?.tenantId || ''}</span>
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
