import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * brand-logos-wiring: locks in the responsive brand mark (extended on ≥lg,
 * simplified on <lg) and ensures the broken `/logo192.png` reference stays
 * gone.
 */

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { fullName: 'Test User', tenantId: 't1' }, logout: vi.fn() }),
}));

vi.mock('@/components/notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

describe('Navbar branding', () => {
  const renderNavbar = () =>
    render(
      <MemoryRouter>
        <Navbar onToggleMobileSidebar={vi.fn()} />
      </MemoryRouter>,
    );

  it('renders both extended and simplified logos with Timtto alt text', () => {
    renderNavbar();
    const logos = screen.getAllByAltText('Timtto');
    expect(logos).toHaveLength(2);
    expect(logos[0].className).toContain('navbar-logo-extended');
    expect(logos[0].className).toContain('d-none');
    expect(logos[0].className).toContain('d-lg-inline-block');
    expect(logos[1].className).toContain('navbar-logo-simplified');
    expect(logos[1].className).toContain('d-inline-block');
    expect(logos[1].className).toContain('d-lg-none');
  });

  it('does not reference the removed /logo192.png', () => {
    renderNavbar();
    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).not.toMatch(/logo192/);
    });
  });

  it('does not render the "TIMTTO" text node next to the brand', () => {
    renderNavbar();
    expect(screen.queryByText('TIMTTO')).not.toBeInTheDocument();
  });
});

describe('Navbar - side menu mode button (sidebar-compacto-colapsable)', () => {
  const renderConModo = (props: Partial<React.ComponentProps<typeof Navbar>> = {}) =>
    render(
      <MemoryRouter>
        <Navbar onToggleMobileSidebar={vi.fn()} onToggleSidebarModo={vi.fn()} {...props} />
      </MemoryRouter>,
    );

  it('has no desktop button when the layout gives no handler', () => {
    render(<MemoryRouter><Navbar onToggleMobileSidebar={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: /Contraer menú|Expandir menú/ })).toBeNull();
  });

  it('shows "Contraer menú" in fixed mode, only on desktop, not pressed', () => {
    renderConModo();
    const boton = screen.getByRole('button', { name: 'Contraer menú' });
    expect(boton).toHaveAttribute('aria-pressed', 'false');
    expect(boton.className).toContain('d-none');
    expect(boton.className).toContain('d-lg-inline-flex');
  });

  it('shows "Expandir menú" pressed in compact mode and toggles on click', () => {
    const onToggleSidebarModo = vi.fn();
    renderConModo({ sidebarCompacto: true, onToggleSidebarModo });
    const boton = screen.getByRole('button', { name: 'Expandir menú' });
    expect(boton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(boton);
    expect(onToggleSidebarModo).toHaveBeenCalledTimes(1);
  });

  it('the mobile button is untouched and still opens the drawer', () => {
    const onToggleMobileSidebar = vi.fn();
    renderConModo({ onToggleMobileSidebar });
    const movil = screen.getByRole('button', { name: 'Abrir menú' });
    expect(movil.className).toContain('d-lg-none');
    fireEvent.click(movil);
    expect(onToggleMobileSidebar).toHaveBeenCalledTimes(1);
  });

  it('compact mode swaps the logos: the extended one is hidden and the simplified one shows on desktop', () => {
    renderConModo({ sidebarCompacto: true });
    const [extendido, simplificado] = screen.getAllByAltText('Timtto');
    expect(extendido.className).toContain('d-none');
    expect(extendido.className).not.toContain('d-lg-inline-block');
    expect(simplificado.className).toContain('d-inline-block');
    expect(simplificado.className).not.toContain('d-lg-none');
    expect(document.querySelector('.tt-navbar')?.className).toContain('tt-navbar-compacto');
  });

  it('fixed mode keeps the logos as before', () => {
    renderConModo();
    const [extendido, simplificado] = screen.getAllByAltText('Timtto');
    expect(extendido.className).toContain('d-lg-inline-block');
    expect(simplificado.className).toContain('d-lg-none');
    expect(document.querySelector('.tt-navbar')?.className).not.toContain('tt-navbar-compacto');
  });
});
