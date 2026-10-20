import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import MainLayout from './MainLayout';

describe('MainLayout', () => {
  test('renders application regions and accessibility attributes', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const app = screen.getByRole('application', { name: /Timtto application/i });
    expect(app).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});

describe('MainLayout - compact side menu (sidebar-compacto-colapsable)', () => {
  const renderLayout = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };
  const aside = () => document.querySelector('aside.sidebar') as HTMLElement;

  beforeEach(() => { window.localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  test('starts in fixed mode', () => {
    renderLayout();
    expect(aside()).not.toHaveClass('sidebar-compacto');
    expect(screen.getByRole('button', { name: 'Contraer menú' })).toBeInTheDocument();
  });

  test('the navbar button switches to compact and back, and the choice is remembered', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }));
    expect(aside()).toHaveClass('sidebar-compacto');
    expect(window.localStorage.getItem('timtto.sidebar.modo')).toBe('compacto');
    fireEvent.click(screen.getByRole('button', { name: 'Expandir menú' }));
    expect(aside()).not.toHaveClass('sidebar-compacto');
    expect(window.localStorage.getItem('timtto.sidebar.modo')).toBe('fijo');
  });

  test('a remembered compact choice is restored on load', () => {
    window.localStorage.setItem('timtto.sidebar.modo', 'compacto');
    renderLayout();
    expect(aside()).toHaveClass('sidebar-compacto');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('the floating panel opens over the content without changing the content', () => {
    window.localStorage.setItem('timtto.sidebar.modo', 'compacto');
    vi.useFakeTimers();
    renderLayout();
    const antes = screen.getByRole('main').className;
    fireEvent.mouseEnter(aside());
    act(() => { vi.advanceTimersByTime(250); });
    expect(aside()).toHaveClass('sidebar-flotando');
    expect(screen.getByRole('main').className).toBe(antes);
    expect(document.querySelector('.sidebar-slot')).toHaveClass('sidebar-slot-compacto'); // the slot keeps the strip width
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(aside()).not.toHaveClass('sidebar-flotando');
  });
});
