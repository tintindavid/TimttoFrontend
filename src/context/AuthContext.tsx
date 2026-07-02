import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../services/auth.service';
import { PlatformViewAsService } from '@/services/platformViewAs.service';
import { User } from '@/types/user.types';
import { logger } from '@/utils/logger';

/** Auto-exit after 30 minutes of inactivity (reset on mousemove / keydown). */
const VIEW_AS_TIMEOUT_MS = 30 * 60 * 1000;

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  // View-as state (SuperAdmin impersonating a tenant — persisted in sessionStorage)
  viewAsTenantId: string | null;
  viewAsTenantName: string | null;
  login: (email: string, password: string, tenantId?: string) => Promise<{ mustChangePassword?: boolean }>;
  logout: () => void;
  setTenantId: (tenantId: string) => void;
  enterViewAs: (tenantId: string, tenantName: string) => Promise<void>;
  exitViewAs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenant] = useState<string | null>(localStorage.getItem('tenantId'));

  // View-as state — sourced from sessionStorage so it does not survive page close
  const [viewAsTenantId, setViewAsTenantId] = useState<string | null>(
    sessionStorage.getItem('viewAsTenantId')
  );
  const [viewAsTenantName, setViewAsTenantName] = useState<string | null>(
    sessionStorage.getItem('viewAsTenantName')
  );

  // Inactivity timer ref
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount, if there's a token and no user loaded, fetch current user.
  useEffect(() => {
    const init = async () => {
      console.log('AuthContext init - token:', token);
      console.log('AuthContext init - user:', user);

      if (token && !user) {
        try {
          console.log('AuthContext - Fetching user with authService.me()...');
          const res = await authService.me();
          logger.debug('AuthContext - authService.me() success:', res);
          setUser(res.data);
        } catch (e) {
          console.error('AuthContext - authService.me() failed:', e);
          // If /auth/me fails (404 or other), try refreshing the token if a refreshToken exists.
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const newToken = await authService.refreshToken(refreshToken);
              if (newToken) {
                setToken(newToken);
                // attempt to load user again
                try {
                  const r2 = await authService.me();
                  setUser(r2.data);
                } catch (e2) {
                  setUser(null);
                }
              } else {
                // Couldn't refresh; keep token in storage but user remains null.
                setUser(null);
              }
            } catch (refreshErr) {
              // Refresh failed; keep token in localStorage to maintain session state client-side.
              setUser(null);
            }
          } else {
            // No refresh token: keep client-side token and treat user as null — do not force logout on page reload.
            setUser(null);
          }
        }
      }
    };
    init();
  }, [token, user]);

  // ---------------------------------------------------------------------------
  // Auto-exit view-as timer
  // ---------------------------------------------------------------------------

  /** Reset the inactivity countdown. Called on every user interaction. */
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      // exitViewAs needs to be stable — call the ref version to avoid stale closure
      handleAutoExit();
    }, VIEW_AS_TIMEOUT_MS);
  };

  const handleAutoExit = async () => {
    try {
      await PlatformViewAsService.exit();
    } catch (err) {
      logger.debug('Auto-exit view-as: audit call failed (non-critical)', err);
    }
    sessionStorage.removeItem('viewAsTenantId');
    sessionStorage.removeItem('viewAsTenantName');
    setViewAsTenantId(null);
    setViewAsTenantName(null);
    toast.info('Sesión de view-as expirada por inactividad');
  };

  // Set up / tear down inactivity listeners whenever view-as is active
  useEffect(() => {
    if (!viewAsTenantId) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    // Start the timer
    resetInactivityTimer();

    const onActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAsTenantId]);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const login = async (
    email: string,
    password: string,
    tid?: string
  ): Promise<{ mustChangePassword?: boolean }> => {
    const res = await authService.login(email, password, tid);
    const t = res.data.token;
    const refresh = res.data.refreshToken;
    setToken(t);
    if (t) localStorage.setItem('token', t);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (res.data.user) setUser(res.data.user);
    if (tid) {
      localStorage.setItem('tenantId', tid);
      setTenant(tid);
    }
    // Return mustChangePassword flag so LoginPage can redirect
    return { mustChangePassword: res.data.mustChangePassword };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear view-as state on logout
    sessionStorage.removeItem('viewAsTenantId');
    sessionStorage.removeItem('viewAsTenantName');
    setViewAsTenantId(null);
    setViewAsTenantName(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  const setTenantId = (tid: string) => {
    localStorage.setItem('tenantId', tid);
    setTenant(tid);
  };

  // ---------------------------------------------------------------------------
  // View-as actions
  // ---------------------------------------------------------------------------

  const enterViewAs = async (tid: string, tName: string): Promise<void> => {
    // Persist first so the interceptor sends the correct header in the audit call
    sessionStorage.setItem('viewAsTenantId', tid);
    sessionStorage.setItem('viewAsTenantName', tName);
    setViewAsTenantId(tid);
    setViewAsTenantName(tName);
    try {
      await PlatformViewAsService.enter(tid);
    } catch (err) {
      logger.debug('enterViewAs: audit call failed (non-critical)', err);
    }
    toast.info(`Viendo como ${tName}`);
  };

  const exitViewAs = async (): Promise<void> => {
    try {
      await PlatformViewAsService.exit();
    } catch (err) {
      logger.debug('exitViewAs: audit call failed (non-critical)', err);
    }
    sessionStorage.removeItem('viewAsTenantId');
    sessionStorage.removeItem('viewAsTenantName');
    setViewAsTenantId(null);
    setViewAsTenantName(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantId,
        isAuthenticated: !!token,
        viewAsTenantId,
        viewAsTenantName,
        login,
        logout,
        setTenantId,
        enterViewAs,
        exitViewAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
