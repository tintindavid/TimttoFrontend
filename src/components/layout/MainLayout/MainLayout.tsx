import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import ViewAsBanner, { VIEW_AS_BANNER_HEIGHT } from '@/components/common/ViewAsBanner';
import { useAuth } from '@/context/AuthContext';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { viewAsTenantId } = useAuth();

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  // Push app content down when the view-as banner is visible
  const bannerOffset = viewAsTenantId ? VIEW_AS_BANNER_HEIGHT : 0;

  return (
    <>
      <ViewAsBanner />
      <div
        className="app-root"
        role="application"
        aria-label="Timtto application"
        style={{ paddingTop: bannerOffset }}
      >
        <Navbar onToggleMobileSidebar={toggleMobileSidebar} />
        <div className="app-body">
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={closeMobileSidebar}
          />
          <main className="app-content" role="main" tabIndex={-1} aria-live="polite">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
