import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LegacyCustomerRedirect } from './LegacyCustomerRedirect';

const Probe = () => {
  const l = useLocation();
  return <div data-testid="loc">{l.pathname + l.search}</div>;
};

const go = (url: string) => {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="customers" element={<LegacyCustomerRedirect />} />
        <Route path="customers/new" element={<LegacyCustomerRedirect />} />
        <Route path="customers/:id" element={<LegacyCustomerRedirect />} />
        <Route path="customers/:id/edit" element={<LegacyCustomerRedirect />} />
        <Route path="terceros/*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByTestId('loc').textContent;
};

describe('LegacyCustomerRedirect', () => {
  it.each([
    ['/customers', '/terceros'],
    ['/customers/new', '/terceros/new'],
    ['/customers/abc123', '/terceros/abc123'],
    ['/customers/abc123/edit', '/terceros/abc123/edit'],
    ['/customers?x=1', '/terceros?x=1'],
  ])('%s -> %s', (from, to) => {
    expect(go(from)).toBe(to);
  });
});
