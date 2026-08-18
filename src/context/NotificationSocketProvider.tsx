import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { createNotificationSocket } from '@/socket/notificationSocket';
import { useAuth } from './AuthContext';
import { Notification, NotificationToastItem } from '@/types/notification.types';
import NotificationToastContainer from '@/components/notifications/NotificationToastContainer';
// Vite bundles the mp3 as a static asset and returns a URL.
import notificationSoundUrl from '@/sound/universfield-new-notification-012-363675.mp3';

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
  // Single audio instance reused per notification. Autoplay policy: modern
  // browsers block audio without prior user interaction — the first play()
  // may reject silently. We log and swallow so a blocked play never crashes
  // the notification flow.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio(notificationSoundUrl);
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.6;
  }

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
      if (doc?.event === 'ot.responsible.assigned') {
        // Mis OTs listing and OT detail depend on `programaciones`; refresh
        // so the newly-assigned responsible sees the OT appear/canWork flip
        // without a manual reload.
        queryClient.invalidateQueries(['ots']);
      }
      if (doc?.event === 'ot.note.added') {
        // Refresh the OT list so the notas count badge updates immediately
        // for anyone browsing /maintenance-orders. OtNotasModal refetches on
        // its own via useEffect at open — no cache key to invalidate.
        queryClient.invalidateQueries(['ots']);
      }

      // Audio cue for every incoming notification. Ignored (silently) if
      // the browser blocks autoplay (no user gesture yet).
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        // `.play()` returns a Promise in real browsers but is undefined in
        // older engines and in jsdom; guard with `?.` so tests don't crash.
        audioRef.current.play()?.catch((err) => {
          // eslint-disable-next-line no-console
          console.debug('[NotificationSocket] audio play blocked:', err?.message);
        });
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
