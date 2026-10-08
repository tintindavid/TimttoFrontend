import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  InputGroup,
  Pagination,
  Spinner,
  Table,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaFilePdf, FaPlus, FaQrcode, FaSearch } from 'react-icons/fa';
import { useSedesByCustomer } from '@/hooks/useSedes';
import { useServiciosByCustomer } from '@/hooks/useServicios';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useEquipmentQrs,
  useExportEquipmentQrPdfBulk,
  useExportEquipmentQrPdfOne,
  useGenerateEquipmentQrsBulk,
} from '@/hooks/useEquipmentQrs';
import { EstadoOperativoValues } from '@/constants/estadoOperativo';
import { EquipmentQr, EquipmentQrListItem } from '@/types/equipmentQr.types';
import { Sede } from '@/types/sede.types';
import { Servicio } from '@/types/servicio.types';
import { getEstadoOperativoBadgeStyle } from '@/utils/estadoOperativoBadge.util';
import EquipmentQrPreviewModal, { EquipmentQrPreviewItem } from './EquipmentQrPreviewModal';

interface EquipmentQrsTabProps {
  customerId: string;
}

const PAGE_SIZE = 20;

const equipoLabel = (row: EquipmentQrListItem): string =>
  [row.item, row.marca, row.modelo].filter(Boolean).join(' · ') || row.equipoId;

const EquipmentQrsTab: React.FC<EquipmentQrsTabProps> = ({ customerId }) => {
  const [sedeId, setSedeId] = useState<string>('');
  const [servicio, setServicio] = useState<string>('');
  const [estadoOperativo, setEstadoOperativo] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItems, setPreviewItems] = useState<EquipmentQrPreviewItem[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'view' | 'export-selected'>('view');

  const debouncedSearch = useDebounce(searchInput, 300);

  // Any change that produces a different result-set resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [sedeId, servicio, estadoOperativo, debouncedSearch]);

  const { data: sedesData, isLoading: loadingSedes } = useSedesByCustomer(customerId);
  const sedes: Sede[] = (sedesData?.data ?? []) as Sede[];

  const { data: serviciosData, isLoading: loadingServicios } = useServiciosByCustomer(customerId);
  const servicios: Servicio[] = (serviciosData?.data ?? []) as Servicio[];

  const filter = useMemo(
    () => ({
      ClienteId: customerId,
      SedeId: sedeId || undefined,
      Servicio: servicio || undefined,
      EstadoOperativo: estadoOperativo || undefined,
      search: debouncedSearch || undefined,
    }),
    [customerId, sedeId, servicio, estadoOperativo, debouncedSearch],
  );

  const listFilters = useMemo(
    () => ({ ...filter, page, limit: PAGE_SIZE }),
    [filter, page],
  );

  const { data, isLoading, isFetching, isError, error } = useEquipmentQrs(listFilters);
  const generateBulkMut = useGenerateEquipmentQrsBulk();
  const exportBulkMut = useExportEquipmentQrPdfBulk();
  const exportOneMut = useExportEquipmentQrPdfOne();

  const rows: EquipmentQrListItem[] = data?.data ?? [];
  const totalCount = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const visibleSelectableIds = rows.map((r) => r.equipoId);
  const allVisibleSelected =
    visibleSelectableIds.length > 0 && visibleSelectableIds.every((id) => selectedIds.has(id));

  const toggleRow = (equipoId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(equipoId)) {
        next.delete(equipoId);
      } else {
        next.add(equipoId);
      }
      return next;
    });
  };

  const toggleAllVisible = (): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleSelectableIds.forEach((id) => next.delete(id));
      } else {
        visibleSelectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleGenerate = async (): Promise<void> => {
    try {
      const res = await generateBulkMut.mutateAsync({ filter });
      const { created, reused } = res.data;
      toast.success(`${created + reused} QRs listos (${created} nuevos, ${reused} reutilizados)`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'No fue posible generar los QRs.',
      );
    }
  };

  const handleExportPdf = (): void => {
    if (selectedIds.size > 0) {
      const selectedPreview: EquipmentQrPreviewItem[] = rows
        .filter((r) => selectedIds.has(r.equipoId) && r.qr)
        .map((r) => ({ qr: r.qr as EquipmentQr, inventario: r.inventario }));
      if (selectedPreview.length === 0) {
        toast.error('Los equipos seleccionados no tienen QR generado todavía. Genere los QRs primero.');
        return;
      }
      setPreviewItems(selectedPreview);
      setPreviewMode('export-selected');
      setShowPreview(true);
      return;
    }
    // No selection → export directly by the current filter (server resolves the set).
    exportBulkMut.mutate(
      { filter },
      {
        onSuccess: () => toast.success('PDF generado.'),
        onError: (err) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
              'No fue posible exportar el PDF.',
          ),
      },
    );
  };

  const handleConfirmExportSelected = (): void => {
    const ids = previewItems.map((p) => p.qr._id);
    exportBulkMut.mutate(
      { ids },
      {
        onSuccess: () => {
          toast.success('PDF generado.');
          setShowPreview(false);
        },
        onError: (err) =>
          toast.error(
            (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
              'No fue posible exportar el PDF.',
          ),
      },
    );
  };

  const handleViewQr = (row: EquipmentQrListItem): void => {
    if (!row.qr) return;
    setPreviewItems([{ qr: row.qr, inventario: row.inventario }]);
    setPreviewMode('view');
    setShowPreview(true);
  };

  const handleExportOne = (qr: EquipmentQr): void => {
    exportOneMut.mutate(qr._id, {
      onSuccess: () => toast.success('PDF generado.'),
      onError: (err) =>
        toast.error(
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            'No fue posible exportar el PDF.',
        ),
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <h6 className="m-0">QR de equipos</h6>
          <small className="text-muted">
            Un QR por equipo, público y de solo lectura: muestra el historial de mantenimiento al escanear.
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleGenerate}
            disabled={generateBulkMut.isLoading}
          >
            <FaPlus className="me-2" />
            {generateBulkMut.isLoading ? 'Generando...' : 'Generar QRs'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            disabled={exportBulkMut.isLoading}
          >
            <FaFilePdf className="me-2" />
            {exportBulkMut.isLoading ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <Form.Select
            aria-label="Filtrar por sede"
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
            disabled={loadingSedes}
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s._id} value={s._id}>{s.nombreSede || 'Sin nombre'}</option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-3">
          <Form.Select
            aria-label="Filtrar por servicio"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            disabled={loadingServicios}
          >
            <option value="">Todos los servicios</option>
            {servicios.map((s) => (
              <option key={s._id} value={s._id}>{s.nombre || 'Sin nombre'}</option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-3">
          <Form.Select
            aria-label="Filtrar por estado operativo"
            value={estadoOperativo}
            onChange={(e) => setEstadoOperativo(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {EstadoOperativoValues.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-3">
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por serie o inventario..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Buscar por serie o inventario"
            />
            {isFetching && !isLoading && (
              <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>
            )}
          </InputGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : isError ? (
        <Alert variant="danger">Error al cargar equipos: {error?.message}</Alert>
      ) : rows.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-muted py-4">
            {debouncedSearch.trim()
              ? 'Ningún equipo coincide con la búsqueda.'
              : 'Este cliente no tiene equipos registrados todavía.'}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Table responsive bordered hover className="bg-white mb-0 tt-card">
            <thead className="table-light">
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    aria-label="Seleccionar todos los visibles"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>Item</th>
                <th>Marca / Modelo</th>
                <th>Serie</th>
                <th>Inventario</th>
                <th>Ubicación</th>
                <th>Estado operativo</th>
                <th>QR actual</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const badgeStyle = getEstadoOperativoBadgeStyle(row.estadoOperativo);
                return (
                  <tr key={row.equipoId}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        aria-label={`Seleccionar ${equipoLabel(row)}`}
                        checked={selectedIds.has(row.equipoId)}
                        onChange={() => toggleRow(row.equipoId)}
                      />
                    </td>
                    <td>{row.item || '—'}</td>
                    <td>{[row.marca, row.modelo].filter(Boolean).join(' / ') || '—'}</td>
                    <td>{row.serie || '—'}</td>
                    <td>{row.inventario || '—'}</td>
                    <td>{row.ubicacion || '—'}</td>
                    <td>
                      <Badge style={badgeStyle}>{row.estadoOperativo || '—'}</Badge>
                    </td>
                    <td>
                      {row.qr ? (
                        <Badge bg={row.qr.active ? 'success' : 'secondary'}>
                          {row.qr.active ? 'Generado' : 'Inactivo'}
                        </Badge>
                      ) : (
                        <span className="text-muted small">Sin QR</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-1"
                        onClick={() => row.qr && handleViewQr(row)}
                        disabled={!row.qr}
                        title="Ver QR"
                      >
                        <FaQrcode />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => row.qr && handleExportOne(row.qr)}
                        disabled={!row.qr || exportOneMut.isLoading}
                        title="Exportar PDF individual"
                      >
                        <FaFilePdf />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">Mostrando {rows.length} de {totalCount}</small>
            {totalPages > 1 && (
              <Pagination className="mb-0">
                <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                    {p}
                  </Pagination.Item>
                ))}
                <Pagination.Next disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} />
              </Pagination>
            )}
          </div>
        </>
      )}

      <EquipmentQrPreviewModal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        items={previewItems}
        onConfirmExport={previewMode === 'export-selected' ? handleConfirmExportSelected : undefined}
        isExporting={exportBulkMut.isLoading}
      />
    </div>
  );
};

export default EquipmentQrsTab;
