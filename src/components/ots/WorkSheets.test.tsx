import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkSheets from './WorkSheets';

const mockUseWorkSheets = vi.fn();
vi.mock('@/hooks/useReportes', () => ({
  useWorkSheets: (...args: unknown[]) => mockUseWorkSheets(...args),
}));

const mockCloseMutate = vi.fn();
const mockUseCloseSheetReports = vi.fn();
vi.mock('@/hooks/useCloseSheetReports', () => ({
  useCloseSheetReports: (...args: unknown[]) => mockUseCloseSheetReports(...args),
}));

const mockSignInPlaceAsync = vi.fn();
vi.mock('@/hooks/useSignInPlace', () => ({
  useSignInPlace: () => ({ mutateAsync: mockSignInPlaceAsync, isPending: false }),
}));

vi.mock('@/components/ots/InPlaceSignSection', () => ({
  __esModule: true,
  default: React.forwardRef(() => null),
}));

vi.mock('@/components/ots/RemoteSignSection', () => ({
  __esModule: true,
  default: () => <div data-testid="remote-sign-section" />,
}));

vi.mock('@/components/ots/ResendSignModal', () => ({
  __esModule: true,
  default: () => null,
}));

const filenameModalMock = vi.fn();
vi.mock('@/components/ots/PdfReportsFilenameModal', () => ({
  __esModule: true,
  default: (props: any) => {
    filenameModalMock(props);
    return props.show ? <div data-testid="pdf-filename-modal">open sheet={props.sheetworkId}</div> : null;
  },
}));

vi.mock('@/components/ots/SendSignedSheetModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('@/services/customer.service', () => ({
  customerService: { getById: vi.fn().mockResolvedValue({ data: { Email: 'x@y.com', correousados: [] } }) },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    token: 'tok-1',
    user: { _id: 'user-1', role: 'admin', firstName: 'Admin', lastName: 'User', fullName: 'Admin User' },
  }),
}));

vi.mock('@/context/userContext', () => ({
  useCurrentUserData: () => ({ _id: 'user-1', role: 'admin', fullName: 'Admin User' }),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsersWithSignature: () => ({ data: { data: [] } }),
}));

vi.mock('@/services/tenant.service', () => ({
  default: { getById: vi.fn().mockResolvedValue({ data: null }) },
}));

vi.mock('@/services/descargarPdf.service', () => ({
  generateBulkPDF: vi.fn(),
}));

vi.mock('@/services/sheetwork.service', () => ({
  sheetworkService: { getPDF: vi.fn(), closeReports: vi.fn() },
}));

vi.mock('@/components/common/PreviewSheetWorkModal', () => ({
  default: () => null,
}));

vi.mock('@/components/common/SignatureInput', () => ({
  default: React.forwardRef(() => null),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args), error: (...args: unknown[]) => mockToastError(...args) },
}));

const baseSheet = (overrides: Record<string, unknown> = {}) => ({
  _id: 'sheet-1',
  numeroHoja: 'HT-0001',
  estado: 'Firmada',
  createdAt: '2026-07-20T10:00:00.000Z',
  source: 'field',
  reports: [{ _id: 'r1', estado: 'Procesado' }],
  ...overrides,
});

const defaultProps = {
  otId: 'ot-1',
  reportesProcesados: [],
  onCreateSheet: vi.fn(),
  onSignSheet: vi.fn(),
  clienteId: 'cli-1',
};

describe('WorkSheets — close-reports icon (sheet-report-closure)', () => {
  beforeEach(() => {
    mockUseWorkSheets.mockReset();
    mockCloseMutate.mockReset();
    mockUseCloseSheetReports.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseCloseSheetReports.mockReturnValue({
      mutate: mockCloseMutate,
      isLoading: false,
      variables: undefined,
    });
  });

  it('renders the icon when the sheet has a Procesado report', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ reports: [{ _id: 'r1', estado: 'Procesado' }] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<WorkSheets {...defaultProps} />);

    expect(screen.getByTitle('Cerrar reportes de esta hoja')).toBeInTheDocument();
  });

  it('does not render the icon when every report is already Cerrado', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ reports: [{ _id: 'r1', estado: 'Cerrado' }] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<WorkSheets {...defaultProps} />);

    expect(screen.queryByTitle('Cerrar reportes de esta hoja')).not.toBeInTheDocument();
  });

  it('clicking the icon dispatches the mutation with the sheet id', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ _id: 'sheet-42', reports: [{ _id: 'r1', estado: 'Procesado' }] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<WorkSheets {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Cerrar reportes de esta hoja'));

    expect(mockCloseMutate).toHaveBeenCalledTimes(1);
    const [sheetId, options] = mockCloseMutate.mock.calls[0];
    expect(sheetId).toBe('sheet-42');

    options.onSuccess();
    expect(mockToastSuccess).toHaveBeenCalledWith('Reportes cerrados');
  });

  it('shows a spinner instead of the icon for the sheet currently being closed', () => {
    mockUseCloseSheetReports.mockReturnValue({
      mutate: mockCloseMutate,
      isLoading: true,
      variables: 'sheet-1',
    });
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ reports: [{ _id: 'r1', estado: 'Procesado' }] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<WorkSheets {...defaultProps} />);

    const button = screen.getByTitle('Cerrar reportes de esta hoja');
    expect(button).toBeDisabled();
  });
});

describe('WorkSheets — EnviadaAFirmar icons (sheetwork-remote-signature)', () => {
  beforeEach(() => {
    mockUseWorkSheets.mockReset();
    mockUseCloseSheetReports.mockReset();
    mockUseCloseSheetReports.mockReturnValue({
      mutate: mockCloseMutate,
      isLoading: false,
      variables: undefined,
    });
  });

  it('renders Reenviar + Firmar-en-sitio icons only for EnviadaAFirmar sheets', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [
        baseSheet({ _id: 'sheet-signed', estado: 'Firmada' }),
        baseSheet({ _id: 'sheet-pending', estado: 'EnviadaAFirmar', reports: [] }),
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<WorkSheets {...defaultProps} />);

    // The EnviadaAFirmar row shows both icons; the Firmada row shows neither.
    expect(screen.getByTitle('Reenviar solicitud de firma')).toBeInTheDocument();
    // Note: `Firmar en sitio` title collides with the existing modal button, so
    // scope by role+title.
    expect(screen.getByRole('button', { name: /firmar en sitio/i })).toBeInTheDocument();
  });

  it('does not render EnviadaAFirmar icons for sheets in other states', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ estado: 'Firmada', reports: [] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<WorkSheets {...defaultProps} />);
    expect(screen.queryByTitle('Reenviar solicitud de firma')).not.toBeInTheDocument();
  });
});

describe('WorkSheets — Reportes PDF opens filename builder modal', () => {
  beforeEach(() => {
    mockUseWorkSheets.mockReset();
    mockUseCloseSheetReports.mockReset();
    filenameModalMock.mockClear();
    mockUseCloseSheetReports.mockReturnValue({
      mutate: mockCloseMutate,
      isLoading: false,
      variables: undefined,
    });
  });

  it('opens the PdfReportsFilenameModal when the "Reportes PDF" button is clicked (no direct download)', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ _id: 'sheet-pdf', estado: 'Firmada', reports: [{ _id: 'r1', estado: 'Cerrado' }] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<WorkSheets {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /reportes pdf/i }));
    expect(screen.getByTestId('pdf-filename-modal').textContent).toContain('sheet-pdf');
  });
});

describe('WorkSheets — canWork gating (ot-responsables-programacion-trazable)', () => {
  beforeEach(() => {
    mockUseWorkSheets.mockReset();
    mockUseCloseSheetReports.mockReset();
    mockUseCloseSheetReports.mockReturnValue({
      mutate: mockCloseMutate,
      isLoading: false,
      variables: undefined,
    });
  });

  const activeResponsables = [
    { userId: 'u1', snapshotName: 'M. Duran' },
    { userId: 'u2', snapshotName: 'J. Perez' },
  ];

  it('enables "Crear Hoja" and "Firmar" by default (canWork undefined behaves as true)', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ estado: 'Borrador', reports: [] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<WorkSheets {...defaultProps} reportesProcesados={[{ _id: 'r1', equipoSnapshot: {} }]} />);

    expect(screen.getByRole('button', { name: /crear hoja/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /firmar/i })).toBeEnabled();
  });

  it('disables "Crear Hoja" and "Firmar" with a tooltip listing the active responsables when canWork is false', async () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ estado: 'Borrador', reports: [] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(
      <WorkSheets
        {...defaultProps}
        reportesProcesados={[{ _id: 'r1', equipoSnapshot: {} }]}
        canWork={false}
        activeResponsables={activeResponsables}
      />,
    );

    const crearHojaButton = screen.getByRole('button', { name: /crear hoja/i });
    const firmarButton = screen.getByRole('button', { name: /^firmar$/i });
    expect(crearHojaButton).toBeDisabled();
    expect(firmarButton).toBeDisabled();

    // Disabled buttons don't fire mouse events directly — OverlayTrigger's
    // gateButton() wraps them in a focusable/hoverable <span>, matching the
    // pattern react-bootstrap docs recommend for tooltips on disabled
    // controls. Hover the wrapper to assert the tooltip copy.
    fireEvent.mouseOver(crearHojaButton.parentElement as HTMLElement);
    await waitFor(() =>
      expect(
        screen.getByText(/Solo los responsables asignados pueden trabajar esta OT\. Responsables actuales: M\. Duran, J\. Perez/i),
      ).toBeInTheDocument(),
    );
  });

  it('disables "Firmar en sitio" when canWork is false', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ estado: 'EnviadaAFirmar', reports: [] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<WorkSheets {...defaultProps} canWork={false} activeResponsables={activeResponsables} />);

    expect(screen.getByRole('button', { name: /firmar en sitio/i })).toBeDisabled();
  });

  it('does not gate read-only actions ("Ver HT") when canWork is false', () => {
    mockUseWorkSheets.mockReturnValue({
      data: [baseSheet({ estado: 'Firmada', reports: [] })],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<WorkSheets {...defaultProps} canWork={false} activeResponsables={activeResponsables} />);

    expect(screen.getByRole('button', { name: /ver ht/i })).toBeEnabled();
  });
});
