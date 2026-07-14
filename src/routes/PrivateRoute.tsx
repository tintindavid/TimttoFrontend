import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { userHasPermission } from '@/utils/permissions';

interface Props {
  children: React.ReactElement;
  /** Legacy role gate — used for superadmin-only screens. */
  roles?: string[];
  /**
   * Require the user's role to include ALL listed permissions. superadmin
   * bypasses this check (platform operators are not tenant users).
   */
  permissions?: string[];
}

export const PrivateRoute: React.FC<Props> = ({ children, roles, permissions }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  if (permissions && permissions.length > 0) {
    const allowed = permissions.every((permission) => userHasPermission(user, permission));
    if (!allowed) return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
