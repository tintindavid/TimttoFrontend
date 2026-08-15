import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { createNotificationSocket } from '@/socket/notificationSocket';
import { useAuth } from './AuthContext';
import { Notification, NotificationToastItem } from '@/types/notification.types';
import NotificationToastContainer from '@/components/notifications/NotificationToastContainer';

interface NotificationSocketContextType {
  toasts: NotificationToastItem[];
  dismissToast: (id: string) => void;
}

const NotificationSocketContext = createContext<NotificationSocketContextType | undefined>(undefined);

const MAX_TOASTS = 5;

/**
 * ONE socket per app. Mounted inside both AuthProvider and QueryClientProvider
 * (main.tsx). Connects when a JWT is present, disconnects when it is cleared.
 * Consumes React Query only to invalidate — never exposes the raw socket.
 */
export const NotificationSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<NotificationToastItem[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Read the token fresh on each (re)connection attempt so silent JWT
    // rotation (axios interceptor updates localStorage) does not leave the
    // socket handshake retrying forever with a stale token (design.md D2).
    const socket = createNotificationSocket(() => localStorage.getItem('token'));
    socketRef.current = socket;

    socket.on('notification', (doc: Notification) => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['notifications', 'unread-count']);

      // Event-specific cache invalidation: when the bus delivers a domain
      // event, ensure the corresponding domain query is refreshed too so
      // that clicking the bell (or already having the affected view open)
      // shows the post-event state, not stale cached data. Keep this list
      // narrow — one entry per business event.
      if (doc?.event === 'sheet.signed') {
        queryClient.invalidateQueries(['worksheets']);
      }

      setToasts((current) => [{ id: doc._id, title: doc.title, body: doc.body }, ...current].slice(0, MAX_TOASTS));
    });

    // On handshake failure (invalid/expired JWT) log and let Socket.IO's
    // built-in reconnection backoff retry — the callback-form auth above
    // will pick up the fresh token on the next attempt.
    socket.on('connect_error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.warn('[NotificationSocket] connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <NotificationSocketContext.Provider value={{ toasts, dismissToast }}>
      {children}
      <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationSocketContext.Provider>
  );
};

export const useNotificationSocket = (): NotificationSocketContextType => {
  const ctx = useContext(NotificationSocketContext);
  if (!ctx) throw new Error('useNotificationSocket must be used within NotificationSocketProvider');
  return ctx;
};

export default NotificationSocketProvider;
