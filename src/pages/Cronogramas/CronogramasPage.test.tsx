import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CronogramasPage from './CronogramasPage';

const { porCliente, montajes } = vi.hoisted(() => ({ porCliente: vi.fn(), montajes: vi.fn() }));
vi.mock('./CronogramaPorCliente', async () => {
  const react = await import('react');
  return {
    CronogramaPorCliente: (props: { clienteFijoId?: string }) => {
      porCliente(props);
      react.useEffect(() => { montajes(props.clienteFijoId ?? null); }, []);
      return react.createElement('div', { 'data-testid': 'por-cliente' });
    },
  };
});
vi.mock('./CronogramaGeneral', () => ({ CronogramaGeneral: () => <div data-testid="general" /> }));

let caps: { executesServices: boolean; organizationCustomerId: string | null; isLoading?: boolean };
vi.mock('@/context/TenantCapabilitiesContext', () => ({
  useTenantCapabilities: () => ({ ...caps, can: (c: string) => (c === 'managesCustomers' ? caps.executesServices : true) }),
}));

beforeEach(() => {
  porCliente.mockClear();
  montajes.mockClear();
});

describe('CronogramasPage tabs', () => {
  it('a client organization sees "Mi Cronograma" with its client fixed', () => {
    caps = { executesServices: false, organizationCustomerId: 'org1' };
    render(<CronogramasPage />);
    expect(screen.getByRole('tab', { name: /Mi Cronograma/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Por Cliente/ })).toBeNull();
    expect(porCliente).toHaveBeenCalledWith({ clienteFijoId: 'org1' });
  });

  it('a tenant that executes services keeps "Por Cliente" without a fixed client', () => {
    caps = { executesServices: true, organizationCustomerId: null };
    render(<CronogramasPage />);
    expect(screen.getByRole('tab', { name: /Por Cliente/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Mi Cronograma/ })).toBeNull();
    expect(porCliente).toHaveBeenCalledWith({ clienteFijoId: undefined });
  });

  it('a hybrid tenant with its own client still keeps the selector', () => {
    caps = { executesServices: true, organizationCustomerId: 'org1' };
    render(<CronogramasPage />);
    expect(screen.getByRole('tab', { name: /Por Cliente/ })).toBeInTheDocument();
    expect(porCliente).toHaveBeenCalledWith({ clienteFijoId: undefined });
  });

  it('a tenant without services and without its client keeps "Por Cliente"', () => {
    caps = { executesServices: false, organizationCustomerId: null };
    render(<CronogramasPage />);
    expect(screen.getByRole('tab', { name: /Por Cliente/ })).toBeInTheDocument();
  });

  it('always offers the General tab', () => {
    caps = { executesServices: false, organizationCustomerId: 'org1' };
    render(<CronogramasPage />);
    expect(screen.getByRole('tab', { name: /Cronograma General/ })).toBeInTheDocument();
  });
});

describe('CronogramasPage while the capabilities load or change', () => {
  it('shows a spinner and no tabs while the capabilities load', () => {
    caps = { executesServices: true, organizationCustomerId: null, isLoading: true };
    render(<CronogramasPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(porCliente).not.toHaveBeenCalled();
  });

  it('a client organization never mounts the schedule with the selector first', () => {
    caps = { executesServices: false, organizationCustomerId: 'org1', isLoading: true };
    const { rerender } = render(<CronogramasPage />);
    expect(montajes).not.toHaveBeenCalled();
    caps = { executesServices: false, organizationCustomerId: 'org1', isLoading: false };
    rerender(<CronogramasPage />);
    expect(montajes).toHaveBeenCalledTimes(1);
    expect(montajes).toHaveBeenLastCalledWith('org1');
  });

  it('remounts the schedule when the fixed client changes (view-as another tenant)', () => {
    caps = { executesServices: true, organizationCustomerId: null };
    const { rerender } = render(<CronogramasPage />);
    expect(montajes).toHaveBeenLastCalledWith(null);
    caps = { executesServices: false, organizationCustomerId: 'org2' };
    rerender(<CronogramasPage />);
    expect(montajes).toHaveBeenCalledTimes(2);
    expect(montajes).toHaveBeenLastCalledWith('org2');
    caps = { executesServices: false, organizationCustomerId: 'org3' };
    rerender(<CronogramasPage />);
    expect(montajes).toHaveBeenCalledTimes(3);
    expect(montajes).toHaveBeenLastCalledWith('org3');
  });
});
