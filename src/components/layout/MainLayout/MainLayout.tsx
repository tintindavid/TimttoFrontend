import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  return (
    <div className="app-root" role="application" aria-label="Timtto application">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content" role="main" tabIndex={-1} aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
