import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="app-root" role="application" aria-label="Timtto application">
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
  );
};

export default MainLayout;
