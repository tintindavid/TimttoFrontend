import React, { useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlus, FaQrcode, FaKey, FaBan, FaCheck, FaTrash } from 'react-icons/fa';
import {
  useServiceQrs,
  useActivateQr,
  useDeactivateQr,
  useDeleteQr,
} from '@/hooks/useServiceQrs';
import { ServiceQr } from '@/types/serviceQr.types';
import CreateServiceQrModal from '@/pages/Configuracion/components/CreateServiceQrModal';
import RotatePasswordModal from '@/pages/Configuracion/components/RotatePasswordModal';
import QrImageModal from '@/pages/Configuracion/components/QrImageModal';

interface CustomerQrsSectionProps {
  customerId: string;
}

const renderName = (
  value: string | { nombre?: string; nombreSede?: string } | null | undefined,
): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.nombre || value.nombreSede || '';
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const CustomerQrsSection: React.FC<CustomerQrsSectionProps> = ({ customerId }) => {
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [rotateTarget, setRotateTarget] = useState<ServiceQr | null>(null);
  const [imageTarget, setImageTarget] = useState<ServiceQr | null>(null);

  const filters = useMemo(() => ({ ClienteId: customerId }), [customerId]);
  const qrsQuery = useServiceQrs(filters);
  const activateMut = useActivateQr();
  const deactivateMut = useDeactivateQr();
  const deleteMut = useDeleteQr();

  const qrs: ServiceQr[] = (qrsQuery.data?.data ?? []) as ServiceQr[];

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
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h6 className="m-0">QRs del cliente</h6>
          <small className="text-muted">
            Un QR por combinación (sede + servicio). Al crearlo se genera la URL pública y la imagen escaneable.
          </small>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <FaPlus className="me-2" />
          Crear QR
        </Button>
      </div>

      {qrsQuery.isLoading ? (
        <div className="text-center py-4">
          <Spinner animation="border" />
        </div>
      ) : qrsQuery.isError ? (
        <Alert variant="danger">
          Error al cargar QRs: {qrsQuery.error?.message}
        </Alert>
      ) : qrs.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-muted py-4">
            Este cliente no tiene QRs configurados todavía.
          </Card.Body>
        </Card>
      ) : (
        <Table responsive bordered hover className="bg-white mb-0">
          <thead className="table-light">
            <tr>
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

      <CreateServiceQrModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        defaultClienteId={customerId}
      />
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

export default CustomerQrsSection;
