import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
