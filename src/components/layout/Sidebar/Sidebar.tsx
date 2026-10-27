import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCogs, FaTools, FaUsers, FaClipboardList, FaFilePdf, FaBuilding, FaList, FaCog, FaCalendarAlt, FaBook, FaFileAlt, FaTimes, FaUserShield, FaTicketAlt, FaQrcode, FaLayerGroup, FaCity, FaFileInvoice } from 'react-icons/fa';
import { Nav } from 'react-bootstrap';
import { useAuth } from '@/context/AuthContext';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import type { TenantCapability } from '@/types';
import { useEsEscritorio } from '@/hooks/useEsEscritorio';
import './Sidebar.css';

type MenuItem = {
  id: string;
  label: string;
  path?: string;
  icon?: React.ReactNode;
  subItems?: MenuItem[];
  /** Hidden when the tenant lacks this capability (`usesQrs` = premium module "QRs y tickets"). */
  requires?: TenantCapability;
};

const buildThirdPartyItems = (base: MenuItem, organizationCustomerId: string | null): MenuItem[] => [
  ...(organizationCustomerId
    ? [{ ...base, id: 'org-info', label: 'Mi información', path: `/terceros/${organizationCustomerId}` }]
    : []),
  { ...base, id: 'providers', label: 'Proveedores', path: '/terceros?tab=provider' },
];

const baseMenu: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: <FaList /> },
  {
    id: 'tecnica',
    label: 'Técnica',
    icon: <FaTools />,
    subItems: [
      // Protocols and activities are attached to the reports of a work order, so they only make sense when the
      // tenant executes services; a tenant that does not (client organization) keeps just the items catalog.
      { id: 'actividades', label: 'Actividades', path: '/actividades', requires: 'executesServices' },
      { id: 'protocolos', label: 'Protocolos', path: '/protocols', requires: 'executesServices' },
      { id: 'items', label: 'Items', path: '/items' }
    ],
  },
  {
    id: 'ots',
    label: 'Órdenes de Trabajo',
    requires: 'executesServices',
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
      { id: 'repuestos-inventario', label: 'Stock', path: '/repuestos/inventario', requires: 'usesInventoryBasic' },
    ],
  },
  {
    id: 'requisiciones',
    label: 'Requisiciones',
    path: '/requisiciones',
    icon: <FaFileInvoice />,
    requires: 'usesRequisiciones',
    subItems: [
      { id: 'requisiciones-list', label: 'Requisiciones', path: '/requisiciones' },
      { id: 'requisiciones-por-aprobar', label: 'Por aprobar', path: '/requisiciones/por-aprobar' },
      {
        id: 'requisiciones-config',
        label: 'Configuración',
        subItems: [
          { id: 'requisiciones-areas', label: 'Áreas', path: '/requisiciones/configuracion/areas' },
          { id: 'requisiciones-tipos', label: 'Tipos', path: '/requisiciones/configuracion/tipos' },
          { id: 'requisiciones-reglas', label: 'Reglas de aprobación', path: '/requisiciones/configuracion/reglas' },
          { id: 'requisiciones-presupuestos', label: 'Presupuestos', path: '/requisiciones/configuracion/presupuestos' },
        ],
      },
    ],
  },
  { id: 'cronogramas', label: 'Cronogramas', path: '/cronogramas', icon: <FaCalendarAlt /> },
  { id: 'informes', label: 'Informes', path: '/informes', icon: <FaFileAlt />, requires: 'executesServices' },
  { id: 'diario', label: 'Diario', path: '/diario', icon: <FaBook />, requires: 'executesServices' },
  { id: 'customers', label: 'Terceros', path: '/terceros', icon: <FaBuilding /> },
  { id: 'users', label: 'Usuarios', path: '/users', icon: <FaUsers /> },
  { id: 'roles', label: 'Roles', path: '/roles', icon: <FaUserShield /> },
  { id: 'settings', label: 'Configuración', path: '/settings', icon: <FaCog /> },
];

// Admin-only entries (role='admin') injected at the end of the menu.
const adminMenu: MenuItem[] = [
  { id: 'tickets', label: 'Tickets', path: '/tickets', icon: <FaTicketAlt />, requires: 'usesQrs' },
  { id: 'service-qrs', label: 'QR de Servicios', path: '/configuracion/qr-services', icon: <FaQrcode />, requires: 'usesQrs' },
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
  /** Compact mode (a strip of icons) on desktop. Default: fixed. Ignored below the large-screen breakpoint. */
  compacto?: boolean;
  /** The compact menu is open (floating over the content). */
  abierto?: boolean;
  onAbrir?: () => void;
  onCerrar?: () => void;
}

/** Wait before a hover opens the compact menu, so crossing the edge by accident does not open it. */
export const ESPERA_APERTURA_MS = 200;

const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  compacto = false,
  abierto = false,
  onAbrir,
  onCerrar,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const { can, organizationCustomerId } = useTenantCapabilities();
  const esEscritorio = useEsEscritorio();
  // Below the breakpoint the menu is the drawer of always: the compact mode does not exist there.
  const modoCompacto = compacto && esEscritorio;
  const compactoCerrado = modoCompacto && !abierto;
  const asideRef = useRef<HTMLElement | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const managesCustomers = can('managesCustomers');
  const baseAdjusted = baseMenu
    .filter((item) => !item.requires || can(item.requires))
    .flatMap((item) => {
      if (item.id !== 'customers' || managesCustomers) return [item];
      // Tenants that do not manage customers (client organizations, own maintenance): their single organization client and the provider list.
      return buildThirdPartyItems(item, organizationCustomerId);
    })
    // Sub-items can require a capability too (e.g. "Stock" needs usesInventoryBasic).
    .map((item) =>
      item.subItems
        ? {
            ...item,
            subItems: item.subItems
              .filter((s) => !s.requires || can(s.requires))
              .map((s) =>
                s.subItems ? { ...s, subItems: s.subItems.filter((g) => !g.requires || can(g.requires)) } : s
              ),
          }
        : item
    );
  // rollout admin-only — widen role list when feature opens to technician/user
  // superadmin gets platform nav links only (they use AdminLayout for daily work,
  // but may still land on MainLayout for profile/dashboard)
  const menu =
    user?.role === 'superadmin'
      ? [...baseAdjusted, ...superadminMenu]
      : user?.role === 'admin'
      ? [...baseAdjusted, ...adminMenu.filter((item) => !item.requires || can(item.requires))]
      : baseAdjusted;

  const handleMouseEnter = (id: string) => setOpenId(id);
  const handleMouseLeave = () => setOpenId(null);

  const cancelarApertura = () => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  // Hover with intent: the panel opens after a short wait; leaving before it ends cancels it. Once open, leaving does
  // NOT close it (it closes by a click outside, Esc, navigation or a link).
  const handleAsideMouseEnter = () => {
    if (!compactoCerrado) return;
    cancelarApertura();
    temporizador.current = setTimeout(() => {
      temporizador.current = null;
      onAbrir?.();
    }, ESPERA_APERTURA_MS);
  };

  // Keyboard: focus inside the menu opens it at once.
  const handleAsideFocus = () => {
    if (compactoCerrado) onAbrir?.();
  };

  // Touch (no hover): the first tap on the closed strip opens it WITHOUT following the link that was touched.
  const handleAsideClickCapture = (e: React.MouseEvent) => {
    if (!compactoCerrado) return;
    e.preventDefault();
    cancelarApertura();
    onAbrir?.();
  };

  useEffect(() => cancelarApertura, []);
  useEffect(() => {
    if (!modoCompacto) cancelarApertura();
  }, [modoCompacto]);

  // While the compact panel is open: a click outside it or Esc closes it. Listeners exist only while it is open.
  useEffect(() => {
    if (!modoCompacto || !abierto) return undefined;
    const alPresionar = (e: MouseEvent) => {
      if (asideRef.current && !asideRef.current.contains(e.target as Node)) onCerrar?.();
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar?.();
    };
    document.addEventListener('mousedown', alPresionar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPresionar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [modoCompacto, abierto, onCerrar]);

  // Navigating (by the menu or any other way) puts the compact menu back to the strip. Only a CHANGE of route closes
  // it: mounting with the panel already open must not.
  const rutaPrevia = useRef(location.pathname);
  useEffect(() => {
    if (rutaPrevia.current === location.pathname) return;
    rutaPrevia.current = location.pathname;
    if (modoCompacto && abierto) onCerrar?.();
    // only a change of route must close it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLinkClick = (e?: React.MouseEvent) => {
    // Cerrar sidebar en móviles al hacer clic en un link
    if (onCloseMobile) {
      onCloseMobile();
    }
    // and put the compact menu back to the strip; the first tap on a closed strip only OPENS it (the capture handler
    // already prevented the default), so it must not close it again
    if (modoCompacto && !e?.defaultPrevented) onCerrar?.();
  };

  const clases = [
    'sidebar',
    isMobileOpen ? 'sidebar-mobile-open' : '',
    modoCompacto ? 'sidebar-compacto' : '',
    modoCompacto && abierto ? 'sidebar-flotando' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`sidebar-slot ${modoCompacto ? 'sidebar-slot-compacto' : ''}`}>
      {/* Backdrop para móviles */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={asideRef}
        className={clases}
        aria-expanded={!modoCompacto || abierto}
        onMouseEnter={handleAsideMouseEnter}
        onMouseLeave={cancelarApertura}
        onFocusCapture={handleAsideFocus}
        onClickCapture={handleAsideClickCapture}
      >
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
            const pathOnly = m.path?.split('?')[0];
            const active = !pathOnly
              ? false
              : m.id === 'providers'
              ? location.pathname === pathOnly
              : location.pathname.startsWith(pathOnly);
            return (
              <div key={m.id} onMouseEnter={() => handleMouseEnter(m.id)} onMouseLeave={handleMouseLeave}>
                <Nav.Item className={`menu-item ${active ? 'active' : ''}`} title={compactoCerrado ? m.label : undefined}>
                  <div className="d-flex align-items-center">
                    <span className="icon me-2">{m.icon}</span>
                    {m.path ? (
                      <Link to={m.path} className="nav-link p-0 menu-label" aria-label={m.label} onClick={handleLinkClick}>{m.label}</Link>
                    ) : (
                      <span className="nav-label menu-label">{m.label}</span>
                    )}
                  </div>
                </Nav.Item>

                {m.subItems && !compactoCerrado && (
                  <div className={`submenu ${openId === m.id ? 'open' : ''}`}>
                    <Nav className="flex-column ms-3">
                      {m.subItems.map((s) =>
                        s.subItems ? (
                          // Group inside a submenu (e.g. Requisiciones > Configuración): a label plus its links.
                          <Nav.Item key={s.id} className="py-1" role="group" aria-label={s.label}>
                            <span className="nav-label small text-muted">{s.label}</span>
                            <Nav className="flex-column ms-3">
                              {s.subItems.map((g) => (
                                <Nav.Item key={g.id} className="py-1">
                                  <Link to={g.path || '#'} className="nav-link small" onClick={handleLinkClick}>{g.label}</Link>
                                </Nav.Item>
                              ))}
                            </Nav>
                          </Nav.Item>
                        ) : (
                          <Nav.Item key={s.id} className="py-1">
                            <Link to={s.path || '#'} className="nav-link small" onClick={handleLinkClick}>{s.label}</Link>
                          </Nav.Item>
                        )
                      )}
                    </Nav>
                  </div>
                )}
              </div>
            );
          })}
        </Nav>
      </aside>
    </div>
  );
};

export default Sidebar;
