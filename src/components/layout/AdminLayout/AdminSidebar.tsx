import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { FaBuilding, FaUsers, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';
import { BsGraphUp } from 'react-icons/bs';
import { useAuth } from '@/context/AuthContext';

interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  /** True when the feature ships in a future epic (placeholder) */
  disabled?: boolean;
}

const adminNavItems: AdminMenuItem[] = [
  { id: 'tenants', label: 'Tenants', path: '/admin/tenants', icon: <FaBuilding /> },
  { id: 'analytics', label: 'Analytics', path: '/admin/analytics', icon: <BsGraphUp /> },
  { id: 'users', label: 'Usuarios', path: '/admin/users', icon: <FaUsers /> },
  { id: 'audit', label: 'Auditoría', path: '/admin/audit', icon: <FaClipboardList /> },
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="admin-sidebar" aria-label="Navegación de plataforma">
      <div className="admin-sidebar-header">Platform Console</div>

      <Nav className="flex-column mt-2">
        {adminNavItems.map((item) => {
          const isActive =
            !item.disabled && location.pathname.startsWith(item.path);

          return (
            <Nav.Item key={item.id}>
              {item.disabled ? (
                <span
                  className="admin-nav-link admin-nav-link--disabled"
                  aria-disabled="true"
                  title="Disponible en E2"
                >
                  <span className="me-2" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className={`admin-nav-link${isActive ? ' active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="me-2" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )}
            </Nav.Item>
          );
        })}
      </Nav>

      {/* Footer: user info + logout */}
      <div className="mt-auto p-3" style={{ borderTop: '1px solid #2e4457' }}>
        <div
          className="text-truncate"
          style={{ fontSize: '0.75rem', color: '#7ee8d4' }}
          title={user?.email}
        >
          {user?.email}
        </div>
        <button
          className="btn btn-link p-0 mt-1 admin-nav-link"
          style={{ fontSize: '0.8rem', color: '#adb5bd' }}
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt className="me-1" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
