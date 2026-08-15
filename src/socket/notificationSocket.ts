import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO base URL — same host as VITE_API_URL with the trailing `/api/v1`
 * stripped (Socket.IO is co-mounted on the same httpServer as Express, not
 * under the REST prefix). Mirrors `computePublicBase` in
 * `services/publicSheetDownload.service.ts`.
 */
const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000/api/v1';

const computeSocketBase = (apiUrl: string): string => {
  const trimmed = apiUrl.replace(/\/$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed.slice(0, -'/api/v1'.length);
  return trimmed;
};

export const SOCKET_URL = computeSocketBase(RAW_API_URL);

/**
 * Creates a new Socket.IO client authenticated via a callback that is invoked
 * on every (re)connection attempt. The callback form is critical: on JWT
 * rotation (silent refresh via the axios interceptor writes to localStorage
 * without necessarily re-firing the provider effect), the next reconnect
 * picks up the fresh token instead of retrying forever with the stale one
 * (design.md D2). The caller supplies the token source so the provider stays
 * the single owner of auth state.
 */
export const createNotificationSocket = (getToken: () => string | null): Socket => {
  return io(SOCKET_URL, {
    auth: (cb) => cb({ token: getToken() || '' }),
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelayMax: 10000,
  });
};
