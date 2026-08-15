import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationsSettingsPage from './NotificationsSettingsPage';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const sendTestMutate = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useNotificationRules', () => ({
  useNotificationRules: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  useCreateNotificationRule: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useUpdateNotificationRule: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteNotificationRule: () => ({ mutateAsync: vi.fn() }),
  useNotificationEvents: () => ({ data: { data: ['system.test'] }, isLoading: false }),
  useSendTestNotification: () => ({ mutateAsync: sendTestMutate, isLoading: false }),
}));

vi.mock('@/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  useUpsertNotificationPreference: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({ data: { data: [] } }),
}));

function withProviders(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NotificationsSettingsPage', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
    sendTestMutate.mockClear();
  });

  it('hides the Reglas tab for a technician', () => {
    (useAuth as unknown as Mock).mockReturnValue({ user: { role: 'technician', email: 't@x.io' } });
    render(withProviders(<NotificationsSettingsPage />));
    expect(screen.queryByRole('tab', { name: 'Reglas' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mis preferencias' })).toBeInTheDocument();
  });

  it('shows the Reglas tab for an admin and dispatches the test mutation', async () => {
    (useAuth as unknown as Mock).mockReturnValue({ user: { role: 'admin', email: 'a@x.io' } });
    render(withProviders(<NotificationsSettingsPage />));
    expect(screen.getByRole('tab', { name: 'Reglas' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar notificación de prueba' }));
    expect(sendTestMutate).toHaveBeenCalled();
  });
});
