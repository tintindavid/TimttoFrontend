import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: React.ReactElement;
  roles?: string[];
}

export const PrivateRoute: React.FC<Props> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
