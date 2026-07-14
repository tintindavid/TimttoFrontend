import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCogs, FaTools, FaUsers, FaClipboardList, FaFilePdf, FaBuilding, FaList, FaCog, FaCalendarAlt, FaBook, FaFileAlt, FaTimes, FaUserShield, FaTicketAlt, FaQrcode, FaLayerGroup, FaCity } from 'react-icons/fa';
import { Nav } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import './Sidebar.css';

type MenuItem = {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  subItems?: MenuItem[];
};

const hasInventarioPlan = () => {
  const plan = (localStorage.getItem('tenantPlan') || '').toLowerCase();
  return plan.includes('inventario');
};

const baseMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <FaList /> },
  {
    id: 'tecnica',
    label: 'Técnica',
    icon: <FaTools />,
    subItems: [
      { id: 'actividades', label: 'Actividades', path: '/actividades' },
      { id: 'protocolos', label: 'Protocolos', path: '/protocols' },
      { id: 'items', label: 'Items', path: '/items' }

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
  {
    id: 'repuestos',
    label: 'Repuestos',
    icon: <FaCogs />,
    subItems: [
      { id: 'repuestos-solicitados', label: 'Solicitados', path: '/repuestos/solicitados' },
      { id: 'repuestos-inventario', label: 'Inventario', path: '/repuestos/inventario' },
    ],
  },
  { id: 'cronogramas', label: 'Cronogramas', path: '/cronogramas', icon: <FaCalendarAlt /> },
  { id: 'informes', label: 'Informes', path: '/informes', icon: <FaFileAlt /> },
  { id: 'diario', label: 'Diario', path: '/diario', icon: <FaBook /> },
  { id: 'customers', label: 'Clientes', path: '/customers', icon: <FaBuilding /> },
  { id: 'users', label: 'Usuarios', path: '/users', icon: <FaUsers /> },
  { id: 'roles', label: 'Roles', path: '/roles', icon: <FaUserShield /> },
  { id: 'settings', label: 'Configuración', path: '/settings', icon: <FaCog /> },
];

// Admin-only entries (role='admin') injected at the end of the menu.
const adminMenu: MenuItem[] = [
  { id: 'tickets', label: 'Tickets', path: '/tickets', icon: <FaTicketAlt /> },
  { id: 'service-qrs', label: 'QR de Servicios', path: '/configuracion/qr-services', icon: <FaQrcode /> },
  // "Mi organización" link for tenant admins (not superadmin — they go to /admin)
  { id: 'my-organization', label: 'Mi Organización', path: '/my-organization', icon: <FaCity /> },
];

// SuperAdmin-only entries — Platform Console links.
// Non-superadmin users must NOT see these.
const superadminMenu: MenuItem[] = [
  { id: 'platform-tenants', label: 'Tenants', path: '/admin/tenants', icon: <FaLayerGroup /> },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const inventoryEnabled = hasInventarioPlan();
  const baseAdjusted = baseMenu.map((item) => {
    if (item.id !== 'repuestos' || !item.subItems) return item;
    return {
      ...item,
      subItems: item.subItems.filter((s) => s.id !== 'repuestos-inventario' || inventoryEnabled),
    };
  });
  // rollout admin-only — widen role list when feature opens to technician/user
  // superadmin gets platform nav links only (they use AdminLayout for daily work,
  // but may still land on MainLayout for profile/dashboard)
  const menu =
    user?.role === 'superadmin'
      ? [...baseAdjusted, ...superadminMenu]
      : user?.role === 'admin'
      ? [...baseAdjusted, ...adminMenu]
      : baseAdjusted;

  const handleMouseEnter = (id: string) => setOpenId(id);
  const handleMouseLeave = () => setOpenId(null);

  const handleLinkClick = () => {
    // Cerrar sidebar en móviles al hacer clic en un link
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop para móviles */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Botón cerrar para móviles */}
        <button 
          className="sidebar-close-btn d-lg-none" 
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
        >
          <FaTimes size={20} />
        </button>

        <Nav className="flex-column">
          {menu.map((m) => {
            const active = m.path ? location.pathname.startsWith(m.path) : false;
            return (
              <div key={m.id} onMouseEnter={() => handleMouseEnter(m.id)} onMouseLeave={handleMouseLeave}>
                <Nav.Item className={`menu-item ${active ? 'active' : ''}`}>
                  <div className="d-flex align-items-center">
                    <span className="icon me-2">{m.icon}</span>
                    {m.path ? (
                      <Link to={m.path} className="nav-link p-0" onClick={handleLinkClick}>{m.label}</Link>
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
                          <Link to={s.path || '#'} className="nav-link small" onClick={handleLinkClick}>{s.label}</Link>
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
    </>
  );
};

export default Sidebar;
