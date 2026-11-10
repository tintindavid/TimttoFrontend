import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PERMISSIONS } from '@/constants/permissions';

const mocks = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (p: string) => mocks.permissions.has(p),
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('./TableroTab', () => ({ default: () => <div>contenido-tablero</div> }));
vi.mock('./MetricasTab', () => ({ default: () => <div>contenido-metricas</div> }));

import ReportesPage from './ReportesPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportesPage />
    </MemoryRouter>
  );

describe('ReportesPage', () => {
  beforeEach(() => mocks.permissions.clear());

  it('shows only the Tablero tab without requisiciones:reports', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Tablero' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Métricas' })).not.toBeInTheDocument();
    expect(screen.getByText('contenido-tablero')).toBeInTheDocument();
  });

  it('shows the Métricas tab with the permission and switches to it', () => {
    mocks.permissions.add(PERMISSIONS.REQUISICIONES_REPORTS);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Métricas' }));
    expect(screen.getByText('contenido-metricas')).toBeInTheDocument();
    expect(screen.queryByText('contenido-tablero')).not.toBeInTheDocument();
  });
});
