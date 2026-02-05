import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { AuthProvider } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import api from '@/services/api';
import { queryClient } from '@/config/queryClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/global.css';

// Attach auth interceptors to API (handles token refresh and 401 retry)
authService.attachInterceptors(api);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
