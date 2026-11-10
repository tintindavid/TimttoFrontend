import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PERMISSIONS } from '@/constants/permissions';
import type { Requisicion } from '@/types/requisicion.types';

const mocks = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock('@/hooks/usePermission', () => ({
  useCurrentUserPermissions: () => ({
    has: (p: string) => mocks.permissions.has(p),
    hasAny: (l: string[]) => l.some((p) => mocks.permissions.has(p)),
    permissions: [],
    isSuperadmin: false,
  }),
}));
vi.mock('@/hooks/useRequisicionReportes', () => ({
  useExportarComparativo: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useExportarRequisicion: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));
vi.mock('@/hooks/useLicitacion', () => ({
  useGetComparativo: () => ({
    data: {
      data: {
        hayComparables: true,
        proveedores: [{ paId: 'p1', nombre: 'Proveedor Uno', estadoEnvio: 'Respondido', valorTotal: 100, moneda: 'COP' }],
      },
    },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock('./GanadorModal', () => ({ default: () => null }));

import ComparativoCard from './ComparativoCard';

const requisicion = { _id: 'r1', consecutivo: 'REQ-1', estado: 'Cotizacion_Recibida', moneda: 'COP' } as unknown as Requisicion;

describe('ComparativoCard - exports', () => {
  beforeEach(() => mocks.permissions.clear());

  it('hides the exports without purchase permissions', () => {
    render(<ComparativoCard requisicion={requisicion} canSelect={false} />);
    expect(screen.queryByRole('button', { name: 'Descargar PDF del comparativo' })).not.toBeInTheDocument();
  });

  it.each([PERMISSIONS.REQUISICIONES_MANAGE_SUPPLIERS, PERMISSIONS.REQUISICIONES_SELECT_WINNER])(
    'shows the exports with %s',
    (permission) => {
      mocks.permissions.add(permission);
      render(<ComparativoCard requisicion={requisicion} canSelect={false} />);
      expect(screen.getByRole('button', { name: 'Descargar PDF del comparativo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Descargar Excel del comparativo' })).toBeInTheDocument();
    }
  );
});
