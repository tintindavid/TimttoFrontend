import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Redirects legacy `/customers...` URLs (emails, bookmarks) to `/terceros...`,
 * preserving the id, sub-path, query string and hash.
 */
export const LegacyCustomerRedirect: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const target = pathname.replace(/^\/customers/, '/terceros');
  return <Navigate to={`${target}${search}${hash}`} replace />;
};

export default LegacyCustomerRedirect;
