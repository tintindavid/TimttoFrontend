import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

/** Height of the banner in px — consumers use this constant for padding-top. */
export const VIEW_AS_BANNER_HEIGHT = 52;

/**
 * Fixed-top banner displayed whenever the SuperAdmin is in view-as mode.
 * Renders above all content (z-index: 1050) with a high-contrast warning background.
 * The "Salir de view-as" button clears the session and navigates back to /admin/tenants.
 */
const ViewAsBanner: React.FC = () => {
  const { viewAsTenantId, viewAsTenantName, exitViewAs } = useAuth();
  const navigate = useNavigate();

  if (!viewAsTenantId) return null;

  const handleExit = async () => {
    await exitViewAs();
    navigate('/admin/tenants');
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1050,
        height: VIEW_AS_BANNER_HEIGHT,
        backgroundColor: '#ffc107',
        color: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
      }}
    >
      <span className="fw-semibold d-flex align-items-center gap-2">
        <FaEye aria-hidden="true" />
        Viendo como&nbsp;<strong>{viewAsTenantName}</strong>&nbsp;[
        <code style={{ background: 'rgba(0,0,0,0.08)', padding: '1px 4px', borderRadius: 3 }}>
          {viewAsTenantId}
        </code>
        ]&nbsp;— <em>modo solo lectura</em>
      </span>

      <Button
        variant="dark"
        size="sm"
        onClick={handleExit}
        aria-label="Salir del modo vista como tenant"
        className="d-flex align-items-center gap-1"
      >
        <FaTimes aria-hidden="true" />
        Salir de view-as
      </Button>
    </div>
  );
};

export default ViewAsBanner;
