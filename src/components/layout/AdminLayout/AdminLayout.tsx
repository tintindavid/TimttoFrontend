import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';

/**
 * AdminLayout — wraps all /admin/* routes (SuperAdmin Platform Console).
 * Visually distinct from MainLayout: dark-teal sidebar, lighter content area.
 */
const AdminLayout: React.FC = () => {
  return (
    <div className="admin-root" role="application" aria-label="TIMTTO Platform Console">
      {/* Top bar */}
      <header className="admin-topbar">
        <span>
          <span className="admin-topbar-brand">TIMTTO</span>
          <span className="admin-topbar-sub">— Platform Console</span>
        </span>
      </header>

      {/* Body: sidebar + main content */}
      <div className="admin-body">
        <AdminSidebar />
        <main className="admin-content" role="main" tabIndex={-1} aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
