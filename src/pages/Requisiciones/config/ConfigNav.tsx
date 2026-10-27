import React from 'react';
import { Nav } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import ReqHelp from '../help/ReqHelp';

const SECTIONS = [
  { path: '/requisiciones/configuracion/areas', label: 'Áreas', permission: PERMISSIONS.AREAS_READ },
  { path: '/requisiciones/configuracion/tipos', label: 'Tipos', permission: PERMISSIONS.REQUEST_TYPES_READ },
  { path: '/requisiciones/configuracion/reglas', label: 'Reglas de aprobación', permission: PERMISSIONS.APPROVAL_RULES_READ },
  { path: '/requisiciones/configuracion/presupuestos', label: 'Presupuestos', permission: PERMISSIONS.BUDGETS_READ },
];

/** Tabs that move between the configuration screens of the Requisiciones module (only those the user can read). */
const ConfigNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { has } = useCurrentUserPermissions();

  return (
    <Nav variant="tabs" className="mb-3 align-items-center" activeKey={pathname}>
      {SECTIONS.filter((s) => has(s.permission)).map((s) => (
        <Nav.Item key={s.path}>
          <Nav.Link eventKey={s.path} onClick={() => navigate(s.path)}>
            {s.label}
          </Nav.Link>
        </Nav.Item>
      ))}
      <Nav.Item className="ms-auto">
        <ReqHelp id="config.nav" placement="bottom" className="ms-0" />
      </Nav.Item>
    </Nav>
  );
};

export default ConfigNav;
