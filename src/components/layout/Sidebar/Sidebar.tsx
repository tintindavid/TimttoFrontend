import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCogs, FaTools, FaUsers, FaClipboardList, FaFilePdf, FaBuilding, FaList, FaCog, FaCalendarAlt } from 'react-icons/fa';
import { Nav } from 'react-bootstrap';
import './Sidebar.css';

type MenuItem = {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  subItems?: MenuItem[];
};

const menu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <FaList /> },
  {
    id: 'tecnica',
    label: 'Técnica',
    icon: <FaTools />,
    subItems: [
      { id: 'actividades', label: 'Actividades', path: '/actividades' },
      { id: 'items', label: 'Items', path: '/items' },
      { id: 'protocolos', label: 'Protocolos', path: '/protocols' },
      { id: 'hv-equipo', label: 'HV Equipo', path: '/hv-equipo' },
    ],
  },
  {
    id: 'ots',
    label: 'Órdenes de Trabajo',
    icon: <FaClipboardList />,
    subItems: [
      { id: 'ots-list', label: 'Listado OTs', path: '/maintenance-orders' },
      { id: 'ots-new', label: 'Crear OT', path: '/maintenance-orders/new' },
    ],
  },
  { id: 'cronogramas', label: 'Cronogramas', path: '/cronogramas', icon: <FaCalendarAlt /> },
  { id: 'customers', label: 'Clientes', path: '/customers', icon: <FaBuilding /> },
  { id: 'users', label: 'Usuarios', path: '/users', icon: <FaUsers /> },
  { id: 'settings', label: 'Configuración', path: '/settings', icon: <FaCog /> },
];

const Sidebar: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  const location = useLocation();

  const handleMouseEnter = (id: string) => setOpenId(id);
  const handleMouseLeave = () => setOpenId(null);

  return (
    <aside className="sidebar">
      <Nav className="flex-column">
        {menu.map((m) => {
          const active = m.path ? location.pathname.startsWith(m.path) : false;
          return (
            <div key={m.id} onMouseEnter={() => handleMouseEnter(m.id)} onMouseLeave={handleMouseLeave}>
              <Nav.Item className={`menu-item ${active ? 'active' : ''}`}>
                <div className="d-flex align-items-center">
                  <span className="icon me-2">{m.icon}</span>
                  {m.path ? (
                    <Link to={m.path} className="nav-link p-0">{m.label}</Link>
                  ) : (
                    <span className="nav-label">{m.label}</span>
                  )}
                </div>
              </Nav.Item>

              {m.subItems && (
                <div className={`submenu ${openId === m.id ? 'open' : ''}`}>
                  <Nav className="flex-column ms-3">
                    {m.subItems.map((s) => (
                      <Nav.Item key={s.id} className="py-1">
                        <Link to={s.path || '#'} className="nav-link small">{s.label}</Link>
                      </Nav.Item>
                    ))}
                  </Nav>
                </div>
              )}
            </div>
          );
        })}
      </Nav>
    </aside>
  );
};

export default Sidebar;
