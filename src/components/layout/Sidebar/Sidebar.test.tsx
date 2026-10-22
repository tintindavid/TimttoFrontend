import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';

const capsMock = vi.hoisted(() => ({ useTenantCapabilities: vi.fn() }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: capsMock.useTenantCapabilities,
}));

const caps = (
  executesServices: boolean,
  organizationCustomerId: string | null = null,
  usesQrs = true,
  inventoryBasic = true
) => ({
  executesServices,
  registersExternal: !executesServices,
  usesQrs,
  organizationCustomerId,
  isLoading: false,
  can: (c: string) =>
    c === 'executesServices'
      ? executesServices
      : c === 'usesQrs'
        ? usesQrs
        : c === 'usesInventoryBasic'
          ? inventoryBasic
          : !executesServices,
});

beforeEach(() => {
  capsMock.useTenantCapabilities.mockReturnValue(caps(true));
});

const renderSidebar = () =>
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );

describe('Sidebar — admin-only rollout gate for Tickets and QR de Servicios', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
  });

  test('admin sees both Tickets and QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'QR de Servicios' })).toBeInTheDocument();
  });

  test('admin of a tenant without the QR module sees neither Tickets nor QR de Servicios, but keeps Mi Organización', () => {
    capsMock.useTenantCapabilities.mockReturnValue(caps(true, null, false));
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Tickets' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'QR de Servicios' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Mi Organización' })).toBeInTheDocument();
  });

  test('technician does NOT see Tickets or QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'technician', email: 't@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Tickets' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'QR de Servicios' })).not.toBeInTheDocument();
  });

  test('user role does NOT see Tickets or QR de Servicios entries', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'user', email: 'u@x.io' },
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.queryByRole('link', { name: 'Tickets' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'QR de Servicios' })).not.toBeInTheDocument();
  });
});

describe('Sidebar — Stock item', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });
  });

  test('shows Stock (not Inventario) with usesInventoryBasic, regardless of localStorage', () => {
    localStorage.setItem('tenantPlan', 'free');
    renderSidebar();
    expect(screen.getByRole('link', { name: 'Stock' })).toHaveAttribute('href', '/repuestos/inventario');
    expect(screen.queryByRole('link', { name: 'Inventario' })).not.toBeInTheDocument();
    localStorage.removeItem('tenantPlan');
  });

  test('hides Stock without usesInventoryBasic, even with a legacy inventario plan in localStorage', () => {
    localStorage.setItem('tenantPlan', 'premium-inventario');
    capsMock.useTenantCapabilities.mockReturnValue(caps(true, null, true, false));
    renderSidebar();
    expect(screen.queryByRole('link', { name: 'Stock' })).not.toBeInTheDocument();
    localStorage.removeItem('tenantPlan');
  });
});

describe('Sidebar — tenant capabilities', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
    (useAuth as unknown as Mock).mockReturnValue({
      user: { role: 'admin', email: 'a@x.io' },
      isAuthenticated: true,
    });
  });

  test('provider tenant keeps the current menu', () => {
    renderSidebar();

    expect(screen.getByText('Órdenes de Trabajo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Informes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diario' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terceros' })).toHaveAttribute('href', '/terceros');
    expect(screen.queryByRole('link', { name: 'Mi información' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Proveedores' })).not.toBeInTheDocument();
  });

  test('client tenant hides OTs, Informes and Diario and shows Mi información and Proveedores', () => {
    capsMock.useTenantCapabilities.mockReturnValue(caps(false, 'org123'));
    renderSidebar();

    expect(screen.queryByText('Órdenes de Trabajo')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Listado OTs' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Informes' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Diario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Terceros' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi información' })).toHaveAttribute('href', '/terceros/org123');
    expect(screen.getByRole('link', { name: 'Proveedores' })).toHaveAttribute('href', '/terceros?tab=provider');
    // Common modules stay
    expect(screen.getByRole('link', { name: 'Cronogramas' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// sidebar-compacto-colapsable
// ---------------------------------------------------------------------------
import { fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach } from 'vitest';
import { ESPERA_APERTURA_MS } from './Sidebar';

const Ubicacion: React.FC = () => <span data-testid="ruta">{useLocation().pathname}</span>;
const Navegar: React.FC<{ a: string }> = ({ a }) => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(a)}>ir-{a}</button>;
};

/** Sidebar in compact mode with its state kept by the test, like MainLayout does. */
const Compacto: React.FC<{
  inicialAbierto?: boolean;
  onAbrir?: () => void;
  onCerrar?: () => void;
  compacto?: boolean;
}> = ({ inicialAbierto = false, onAbrir, onCerrar, compacto = true }) => {
  const [abierto, setAbierto] = React.useState(inicialAbierto);
  return (
    <MemoryRouter initialEntries={['/']}>
      <Sidebar
        compacto={compacto}
        abierto={abierto}
        onAbrir={() => { onAbrir?.(); setAbierto(true); }}
        onCerrar={() => { onCerrar?.(); setAbierto(false); }}
      />
      <Navegar a="/users" />
      <Ubicacion />
    </MemoryRouter>
  );
};

const aside = () => document.querySelector('aside.sidebar') as HTMLElement;

describe('Sidebar - compact mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useAuth as unknown as Mock).mockReset();
    (useAuth as unknown as Mock).mockReturnValue({ user: { role: 'admin', email: 'a@x.io' }, isAuthenticated: true });
    capsMock.useTenantCapabilities.mockReturnValue(caps(true));
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });
  afterEach(() => { vi.useRealTimers(); });

  test('fixed mode is the menu of always: nothing floats, hover does nothing', () => {
    const onAbrir = vi.fn();
    render(<Compacto compacto={false} onAbrir={onAbrir} />);
    expect(aside()).not.toHaveClass('sidebar-compacto');
    expect(aside()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.mouseEnter(aside());
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onAbrir).not.toHaveBeenCalled();
  });

  test('compact closed: strip, collapsed, every option keeps its name and shows it as tooltip', () => {
    render(<Compacto />);
    expect(aside()).toHaveClass('sidebar-compacto');
    expect(aside()).not.toHaveClass('sidebar-flotando');
    expect(aside()).toHaveAttribute('aria-expanded', 'false');
    const enlace = screen.getByRole('link', { name: 'Cronogramas' });
    expect(enlace).toHaveAttribute('aria-label', 'Cronogramas');
    expect(enlace.closest('.menu-item')).toHaveAttribute('title', 'Cronogramas');
  });

  test('hovering opens it only after the wait', () => {
    const onAbrir = vi.fn();
    render(<Compacto onAbrir={onAbrir} />);
    fireEvent.mouseEnter(aside());
    act(() => { vi.advanceTimersByTime(ESPERA_APERTURA_MS - 1); });
    expect(onAbrir).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onAbrir).toHaveBeenCalledTimes(1);
    expect(aside()).toHaveClass('sidebar-flotando');
    expect(aside()).toHaveAttribute('aria-expanded', 'true');
  });

  test('leaving before the wait ends cancels the opening', () => {
    const onAbrir = vi.fn();
    render(<Compacto onAbrir={onAbrir} />);
    fireEvent.mouseEnter(aside());
    act(() => { vi.advanceTimersByTime(ESPERA_APERTURA_MS - 50); });
    fireEvent.mouseLeave(aside());
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onAbrir).not.toHaveBeenCalled();
  });

  test('once open it stays open when the mouse leaves', () => {
    const onCerrar = vi.fn();
    render(<Compacto inicialAbierto onCerrar={onCerrar} />);
    fireEvent.mouseLeave(aside());
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onCerrar).not.toHaveBeenCalled();
    expect(aside()).toHaveClass('sidebar-flotando');
  });

  test('a mouse down outside closes it, one inside does not', () => {
    const onCerrar = vi.fn();
    render(<Compacto inicialAbierto onCerrar={onCerrar} />);
    fireEvent.mouseDown(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(onCerrar).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.body);
    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(aside()).not.toHaveClass('sidebar-flotando');
  });

  test('Esc closes it', () => {
    const onCerrar = vi.fn();
    render(<Compacto inicialAbierto onCerrar={onCerrar} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  test('nothing listens while it is closed', () => {
    const onCerrar = vi.fn();
    render(<Compacto onCerrar={onCerrar} />);
    fireEvent.mouseDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).not.toHaveBeenCalled();
  });

  test('following one of its links puts it back to the strip', () => {
    const onCerrar = vi.fn();
    render(<Compacto inicialAbierto onCerrar={onCerrar} />);
    fireEvent.click(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(onCerrar).toHaveBeenCalled();
    expect(screen.getByTestId('ruta').textContent).toBe('/cronogramas');
    expect(aside()).not.toHaveClass('sidebar-flotando');
  });

  test('navigating any other way also closes it', () => {
    const onCerrar = vi.fn();
    render(<Compacto inicialAbierto onCerrar={onCerrar} />);
    fireEvent.click(screen.getByText('ir-/users'));
    expect(screen.getByTestId('ruta').textContent).toBe('/users');
    expect(onCerrar).toHaveBeenCalled();
  });

  test('keyboard focus inside opens it at once', () => {
    const onAbrir = vi.fn();
    render(<Compacto onAbrir={onAbrir} />);
    fireEvent.focusIn(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(onAbrir).toHaveBeenCalledTimes(1);
    expect(aside()).toHaveClass('sidebar-flotando');
  });

  test('touch: the first tap opens it WITHOUT following the link, the next tap follows it', () => {
    render(<Compacto />);
    fireEvent.click(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(screen.getByTestId('ruta').textContent).toBe('/');
    expect(aside()).toHaveClass('sidebar-flotando');
    fireEvent.click(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(screen.getByTestId('ruta').textContent).toBe('/cronogramas');
  });

  test('submenus are not available while it is a strip, and work once it is open', () => {
    const { unmount } = render(<Compacto />);
    expect(screen.queryByRole('link', { name: 'Listado OTs' })).toBeNull();
    unmount();
    render(<Compacto inicialAbierto />);
    expect(screen.getByRole('link', { name: 'Listado OTs' })).toBeInTheDocument();
  });

  test('the options are exactly the same as in fixed mode, including the filtering by capability', () => {
    capsMock.useTenantCapabilities.mockReturnValue(caps(false, 'org123', false));
    render(<Compacto inicialAbierto />);
    expect(screen.queryByText('Órdenes de Trabajo')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Tickets' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Mi información' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cronogramas' })).toBeInTheDocument();
  });

  test('below the large-screen breakpoint the compact mode does not exist: drawer as always', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = () => ({
      matches: false, addEventListener: () => {}, removeEventListener: () => {},
    });
    const onAbrir = vi.fn();
    render(<Compacto onAbrir={onAbrir} />);
    expect(aside()).not.toHaveClass('sidebar-compacto');
    expect(screen.getByRole('link', { name: 'Listado OTs' })).toBeInTheDocument();
    fireEvent.mouseEnter(aside());
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByRole('link', { name: 'Cronogramas' }));
    expect(onAbrir).not.toHaveBeenCalled();
    expect(screen.getByTestId('ruta').textContent).toBe('/cronogramas'); // the first tap follows the link
  });
});
