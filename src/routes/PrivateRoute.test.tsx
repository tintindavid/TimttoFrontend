import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach, Mock } from 'vitest';
import PrivateRoute from './PrivateRoute';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const Protected = () => <div data-testid="protected-content">protected</div>;
const Home = () => <div data-testid="home">home</div>;
const Login = () => <div data-testid="login">login</div>;

const renderAt = (path: string, roles?: string[]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/admin-only"
          element={
            <PrivateRoute roles={roles}>
              <Protected />
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('PrivateRoute — roles gate', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
  });

  test('unauthenticated user is redirected to /login', () => {
    (useAuth as unknown as Mock).mockReturnValue({ isAuthenticated: false, user: null });
    renderAt('/admin-only', ['admin']);
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('admin role renders the protected element', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'admin' },
    });
    renderAt('/admin-only', ['admin']);
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('technician role is redirected to / when route requires admin', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'technician' },
    });
    renderAt('/admin-only', ['admin']);
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('user role is redirected to / when route requires admin', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'user' },
    });
    renderAt('/admin-only', ['admin']);
    expect(screen.getByTestId('home')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('no roles prop allows any authenticated user', () => {
    (useAuth as unknown as Mock).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'user' },
    });
    renderAt('/admin-only');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
