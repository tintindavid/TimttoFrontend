import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { User } from '@/types/user.types';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  logout: () => void;
  setTenantId: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenant] = useState<string | null>(localStorage.getItem('tenantId'));

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

  const login = async (email: string, password: string, tenantId?: string) => {
    const res = await authService.login(email, password, tenantId);
    const t = res.data.token;
    const refresh = res.data.refreshToken;
    setToken(t);
    if (t) localStorage.setItem('token', t);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (res.data.user) setUser(res.data.user);
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
      setTenant(tenantId);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  const setTenantId = (tenantId: string) => {
    localStorage.setItem('tenantId', tenantId);
    setTenant(tenantId);
  };

  return (
    <AuthContext.Provider value={{ user, token, tenantId, isAuthenticated: !!token, login, logout, setTenantId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
