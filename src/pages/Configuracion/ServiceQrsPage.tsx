import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Spinner,
  Table,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlus, FaQrcode, FaKey, FaBan, FaCheck, FaTrash } from 'react-icons/fa';
import {
  useServiceQrs,
  useActivateQr,
  useDeactivateQr,
  useDeleteQr,
} from '@/hooks/useServiceQrs';
import { useCustomers } from '@/hooks/useCustomers';
import { ServiceQr, ServiceQrListFilters } from '@/types/serviceQr.types';
import { Customer } from '@/types/customer.types';
import CreateServiceQrModal from './components/CreateServiceQrModal';
import RotatePasswordModal from './components/RotatePasswordModal';
import QrImageModal from './components/QrImageModal';

const renderName = (
  value: string | { _id?: string; nombre?: string; Razonsocial?: string; nombreSede?: string } | null | undefined,
): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.Razonsocial || value.nombre || value.nombreSede || '';
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const ServiceQrsPage: React.FC = () => {
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');

  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [rotateTarget, setRotateTarget] = useState<ServiceQr | null>(null);
  const [imageTarget, setImageTarget] = useState<ServiceQr | null>(null);

  const filters: ServiceQrListFilters = useMemo(() => {
    const f: ServiceQrListFilters = {};
    if (clienteFilter) f.ClienteId = clienteFilter;
    if (activeFilter === 'active') f.active = true;
    if (activeFilter === 'inactive') f.active = false;
    return f;
  }, [clienteFilter, activeFilter]);

  const qrsQuery = useServiceQrs(filters);
  const customersQuery = useCustomers();
  const activateMut = useActivateQr();
  const deactivateMut = useDeactivateQr();
  const deleteMut = useDeleteQr();

  const qrs: ServiceQr[] = (qrsQuery.data?.data ?? []) as ServiceQr[];
  const customers: Customer[] = (customersQuery.data?.data ?? []) as Customer[];

  const handleToggleActive = async (qr: ServiceQr): Promise<void> => {
    try {
      if (qr.active) {
        await deactivateMut.mutateAsync(qr._id);
        toast.success('QR desactivado.');
      } else {
        await activateMut.mutateAsync(qr._id);
        toast.success('QR reactivado.');
      }
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'No fue posible actualizar el QR.',
      );
    }
  };

  const handleDelete = async (qr: ServiceQr): Promise<void> => {
    if (!window.confirm(`¿Eliminar el QR para "${renderName(qr.servicioId)}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteMut.mutateAsync(qr._id);
      toast.success('QR eliminado.');
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'No fue posible eliminar el QR.',
      );
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="m-0">QR de Servicios</h3>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <FaPlus className="me-2" />
          Crear QR
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body className="py-3">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div style={{ minWidth: 220 }}>
              <Form.Label className="small mb-1">Cliente</Form.Label>
              <Form.Select size="sm" value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)}>
                <option value="">Todos</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.Razonsocial || 'Sin nombre'}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div style={{ minWidth: 160 }}>
              <Form.Label className="small mb-1">Estado</Form.Label>
              <Form.Select size="sm" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {qrsQuery.isLoading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : qrsQuery.isError ? (
        <Alert variant="danger">Error al cargar QRs: {qrsQuery.error?.message}</Alert>
      ) : qrs.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5 text-muted">
            No hay QRs configurados. Cree el primero con el botón "Crear QR".
          </Card.Body>
        </Card>
      ) : (
        <Table responsive bordered hover className="bg-white">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Sede</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th>Última rotación</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {qrs.map((qr) => (
              <tr key={qr._id}>
                <td>{renderName(qr.ClienteId) || '—'}</td>
                <td>{renderName(qr.sedeId) || '—'}</td>
                <td>{renderName(qr.servicioId) || '—'}</td>
                <td>
                  <Badge bg={qr.active ? 'success' : 'secondary'}>
                    {qr.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="small text-muted">{formatDate(qr.passwordRotatedAt)}</td>
                <td className="text-end">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-1"
                    onClick={() => setImageTarget(qr)}
                    title="Ver QR"
                  >
                    <FaQrcode />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    className="me-1"
                    onClick={() => setRotateTarget(qr)}
                    title="Rotar contraseña"
                  >
                    <FaKey />
                  </Button>
                  <Button
                    size="sm"
                    variant={qr.active ? 'outline-secondary' : 'outline-success'}
                    className="me-1"
                    onClick={() => handleToggleActive(qr)}
                    title={qr.active ? 'Desactivar' : 'Activar'}
                  >
                    {qr.active ? <FaBan /> : <FaCheck />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDelete(qr)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <CreateServiceQrModal show={showCreate} onHide={() => setShowCreate(false)} />
      <RotatePasswordModal
        show={!!rotateTarget}
        onHide={() => setRotateTarget(null)}
        qr={rotateTarget}
      />
      <QrImageModal
        show={!!imageTarget}
        onHide={() => setImageTarget(null)}
        qr={imageTarget}
      />
    </div>
  );
};

export default ServiceQrsPage;
