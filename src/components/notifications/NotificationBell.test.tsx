import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const mutate = vi.fn();
vi.mock('@/hooks/useNotifications', () => ({
  useUnreadCount: () => ({ data: { data: { count: 3 } } }),
  useNotifications: () => ({
    data: {
      data: [
        { _id: 'n1', title: 'HT firmada', body: 'La hoja fue firmada', readAt: null, createdAt: '2026-08-01T10:00:00.000Z', data: null, tenantId: 't1', userId: 'u1', event: 'system.test', channels: ['inapp'] },
        { _id: 'n2', title: 'OT asignada', body: 'Tienes una nueva OT', readAt: '2026-08-01T09:00:00.000Z', createdAt: '2026-07-31T10:00:00.000Z', data: { link: '/ots/1' }, tenantId: 't1', userId: 'u1', event: 'system.test', channels: ['inapp'] },
      ],
    },
    isLoading: false,
  }),
  useMarkAsRead: () => ({ mutate }),
}));

function withProviders(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it('shows the unread count badge', () => {
    render(withProviders(<NotificationBell />));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the dropdown items when opened', () => {
    render(withProviders(<NotificationBell />));
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(screen.getByText('HT firmada')).toBeInTheDocument();
    expect(screen.getByText('OT asignada')).toBeInTheDocument();
  });

  it('invokes markAsRead when an unread item is clicked', () => {
    render(withProviders(<NotificationBell />));
    fireEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    fireEvent.click(screen.getByText('HT firmada'));
    expect(mutate).toHaveBeenCalledWith('n1');
  });
});
