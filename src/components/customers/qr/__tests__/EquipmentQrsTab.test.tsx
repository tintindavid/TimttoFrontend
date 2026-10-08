import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentQrsTab from '../EquipmentQrsTab';
import CustomerQrsSection from '@/components/customers/CustomerQrsSection';
import { EquipmentQrListItem } from '@/types/equipmentQr.types';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

const mockUseEquipmentQrs = vi.fn();
const mockGenerateBulkMutateAsync = vi.fn();
const mockExportBulkMutate = vi.fn();
const mockExportOneMutate = vi.fn();
vi.mock('@/hooks/useEquipmentQrs', () => ({
  useEquipmentQrs: (...args: unknown[]) => mockUseEquipmentQrs(...args),
  useGenerateEquipmentQrsBulk: () => ({
    mutateAsync: mockGenerateBulkMutateAsync,
    isLoading: false,
  }),
  useExportEquipmentQrPdfBulk: () => ({ mutate: mockExportBulkMutate, isLoading: false }),
  useExportEquipmentQrPdfOne: () => ({ mutate: mockExportOneMutate, isLoading: false }),
}));

vi.mock('@/hooks/useSedes', () => ({
  useSedesByCustomer: () => ({ data: { data: [{ _id: 'sede1', nombreSede: 'Sede Norte' }] }, isLoading: false }),
}));

vi.mock('@/hooks/useServicios', () => ({
  useServiciosByCustomer: () => ({ data: { data: [{ _id: 'serv1', nombre: 'Biomédica' }] }, isLoading: false }),
}));

// Not under test here — keep real service-qrs hooks mocked so CustomerQrsSection
// (used in the permission-gating test) doesn't need a QueryClientProvider wrapper.
vi.mock('@/hooks/useServiceQrs', () => ({
  useServiceQrs: () => ({ data: { data: [] }, isLoading: false, isError: false }),
  useActivateQr: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeactivateQr: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useDeleteQr: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useCreateServiceQr: () => ({ mutateAsync: vi.fn(), isLoading: false }),
  useRotateQrPassword: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

// CreateServiceQrModal (rendered inside the "solicitar" sub-tab) also pulls
// customer/sede/servicio dropdown data — stub to keep this suite focused on
// the "QR Equipos" sub-tab gating, not the (unchanged) "solicitar" form.
vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: () => ({ data: { data: [] }, isLoading: false }),
}));

const mockUseHasPermission = vi.fn();
vi.mock('@/hooks/usePermission', () => ({
  useHasPermission: (...args: unknown[]) => mockUseHasPermission(...args),
}));

const sampleRow: EquipmentQrListItem = {
  equipoId: 'eq1',
  item: 'Monitor de signos vitales',
  marca: 'Mindray',
  modelo: 'X1',
  serie: 'S-001',
  inventario: 'INV-001',
  ubicacion: 'UCI',
  estadoOperativo: 'Operativo',
  qr: null,
};

describe('EquipmentQrsTab', () => {
  beforeEach(() => {
    mockUseEquipmentQrs.mockReset();
    mockGenerateBulkMutateAsync.mockReset();
    mockExportBulkMutate.mockReset();
    mockExportOneMutate.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it('happy path: filtering by sede then clicking "Generar QRs" shows the counts toast', async () => {
    mockUseEquipmentQrs.mockReturnValue({
      data: { data: [sampleRow], pagination: { page: 1, limit: 20, total: 1 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    });
    mockGenerateBulkMutateAsync.mockResolvedValue({
      data: { created: 10, reused: 5, items: [] },
    });

    render(<EquipmentQrsTab customerId="cust1" />);

    fireEvent.change(screen.getByLabelText('Filtrar por sede'), { target: { value: 'sede1' } });

    fireEvent.click(screen.getByRole('button', { name: /Generar QRs/ }));

    await screen.findByRole('button', { name: /Generar QRs/ });
    expect(mockGenerateBulkMutateAsync).toHaveBeenCalledWith({
      filter: expect.objectContaining({ ClienteId: 'cust1', SedeId: 'sede1' }),
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('15 QRs listos (10 nuevos, 5 reutilizados)');
  });

  it('shows the friendly empty state when there are no equipos', () => {
    mockUseEquipmentQrs.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    });

    render(<EquipmentQrsTab customerId="cust1" />);

    expect(
      screen.getByText('Este cliente no tiene equipos registrados todavía.'),
    ).toBeInTheDocument();
  });

  it('hides the "QR Equipos" sub-tab when the user lacks service-qrs:create', () => {
    mockUseEquipmentQrs.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    });
    mockUseHasPermission.mockReturnValue(false);

    render(<CustomerQrsSection customerId="cust1" />);

    expect(screen.getByText('Solicitar servicio')).toBeInTheDocument();
    expect(screen.queryByText('QR Equipos')).not.toBeInTheDocument();
  });

  it('renders the "QR Equipos" sub-tab when the user has service-qrs:create', () => {
    mockUseEquipmentQrs.mockReturnValue({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: undefined,
    });
    mockUseHasPermission.mockReturnValue(true);

    render(<CustomerQrsSection customerId="cust1" />);

    expect(screen.getByText('QR Equipos')).toBeInTheDocument();
  });
});
