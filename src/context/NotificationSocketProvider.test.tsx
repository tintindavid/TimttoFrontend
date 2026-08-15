import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationSocketProvider } from './NotificationSocketProvider';
import { useAuth } from './AuthContext';
import { createNotificationSocket } from '@/socket/notificationSocket';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

let notificationHandler: ((doc: any) => void) | undefined;
const disconnect = vi.fn();

vi.mock('@/socket/notificationSocket', () => ({
  createNotificationSocket: vi.fn(() => ({
    on: vi.fn((event: string, handler: (doc: any) => void) => {
      if (event === 'notification') notificationHandler = handler;
    }),
    disconnect,
  })),
}));

// Emulate the localStorage the provider reads through the token getter.
beforeEach(() => {
  localStorage.setItem('token', 'jwt-token');
});

describe('NotificationSocketProvider', () => {
  beforeEach(() => {
    (useAuth as unknown as Mock).mockReset();
    (createNotificationSocket as unknown as Mock).mockClear();
    disconnect.mockClear();
    notificationHandler = undefined;
  });

  it('connects with the JWT and, on an incoming notification event, invalidates queries and shows a toast', () => {
    (useAuth as unknown as Mock).mockReturnValue({ token: 'jwt-token' });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    render(
      <QueryClientProvider client={qc}>
        <NotificationSocketProvider>
          <div>app</div>
        </NotificationSocketProvider>
      </QueryClientProvider>
    );

    // The provider now passes a callback (design.md D2 — fresh token on
    // every reconnect). Verify the fn was called and calling it returns
    // the current token from localStorage.
    expect(createNotificationSocket).toHaveBeenCalledTimes(1);
    const getToken = (createNotificationSocket as unknown as Mock).mock.calls[0][0];
    expect(typeof getToken).toBe('function');
    expect(getToken()).toBe('jwt-token');
    expect(notificationHandler).toBeDefined();

    act(() => {
      notificationHandler?.({ _id: 'n1', title: 'HT firmada', body: 'La hoja fue firmada' });
    });

    expect(invalidateSpy).toHaveBeenCalledWith(['notifications']);
    expect(invalidateSpy).toHaveBeenCalledWith(['notifications', 'unread-count']);
    expect(screen.getByText('HT firmada')).toBeInTheDocument();
    expect(screen.getByText('La hoja fue firmada')).toBeInTheDocument();
  });

  it('does not open a socket when there is no token', () => {
    (useAuth as unknown as Mock).mockReturnValue({ token: null });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={qc}>
        <NotificationSocketProvider>
          <div>app</div>
        </NotificationSocketProvider>
      </QueryClientProvider>
    );

    expect(createNotificationSocket).not.toHaveBeenCalled();
  });
});
