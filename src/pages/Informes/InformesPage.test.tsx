import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

// Isolate the tab-switching / URL-sync behavior from the heavy tab contents.
vi.mock('./tabs/InformesPorMesTab', () => ({
  InformesPorMesTab: () => <div data-testid="tab-meses">Tab meses</div>,
}));
vi.mock('./tabs/InformesPorOtTab', () => ({
  InformesPorOtTab: () => <div data-testid="tab-ot">Tab OT</div>,
}));

import InformesPage from './InformesPage';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
}

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/informes"
          element={
            <>
              <InformesPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InformesPage', () => {
  it('defaults to the "meses" tab when no query param is present', () => {
    renderAt('/informes');
    expect(screen.getByTestId('tab-meses')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-ot')).not.toBeInTheDocument();
  });

  it('opens the "ot" tab when ?tab=ot is present', () => {
    renderAt('/informes?tab=ot');
    expect(screen.getByTestId('tab-ot')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-meses')).not.toBeInTheDocument();
  });

  it('updates the URL when the user switches tabs', () => {
    renderAt('/informes');
    fireEvent.click(screen.getByRole('tab', { name: 'Informe por OT' }));
    expect(screen.getByTestId('location').textContent).toBe('/informes?tab=ot');
    expect(screen.getByTestId('tab-ot')).toBeInTheDocument();
  });

  it('falls back to the "meses" tab for an invalid tab param', () => {
    renderAt('/informes?tab=xyz');
    expect(screen.getByTestId('tab-meses')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-ot')).not.toBeInTheDocument();
  });
});
