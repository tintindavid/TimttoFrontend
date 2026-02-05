import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppRoutes from '@/routes';
import PerformanceMonitor from '@/components/common/PerformanceMonitor';
import { ToastContainer } from 'react-toastify';

const App: React.FC = () => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(
    process.env.NODE_ENV === 'development'
  );

  return (
    <>      <AppRoutes />
      
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Performance Monitor solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceMonitor
          show={showPerformanceMonitor}
          onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
        />
      )}
    </>
  );
};

export default App;
