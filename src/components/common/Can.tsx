import React from 'react';
import { useCurrentUserPermissions, useHasPermission } from '@/hooks/usePermission';

interface Props {
  /** Single permission — the common case. */
  permission?: string;
  /** OR-gate: render if the user has any of these. */
  anyOf?: string[];
  /** Fallback to render when the check fails. Defaults to null. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders `children` when the current user has the required
 * permission(s). Wrap around buttons, menu items, or entire sections that
 * the backend also gates via authorize() — hides the affordance instead of
 * showing something the user cannot use.
 */
export const Can: React.FC<Props> = ({ permission, anyOf, fallback = null, children }) => {
  const singleAllowed = useHasPermission(permission || '__never__');
  const { hasAny } = useCurrentUserPermissions();

  let allowed = false;
  if (permission) allowed = singleAllowed;
  else if (anyOf && anyOf.length > 0) allowed = hasAny(anyOf);

  return <>{allowed ? children : fallback}</>;
};

export default Can;
