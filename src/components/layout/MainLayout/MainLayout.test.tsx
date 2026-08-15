import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import MainLayout from './MainLayout';

describe('MainLayout', () => {
  test('renders application regions and accessibility attributes', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const app = screen.getByRole('application', { name: /Timtto application/i });
    expect(app).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
