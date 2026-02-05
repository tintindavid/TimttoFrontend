import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import MainLayout from './MainLayout';

describe('MainLayout', () => {
  test('renders application regions and accessibility attributes', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </AuthProvider>
    );

    const app = screen.getByRole('application', { name: /Timtto application/i });
    expect(app).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
