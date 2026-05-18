import React from 'react';
import { useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '@/components/common/Pagination';
import RepuestoStatusDropdown from '@/components/repuestos/RepuestoStatusDropdown';
import CreateOtFromRepuestosModal from '@/components/repuestos/CreateOtFromRepuestosModal';
import { useCustomers } from '@/hooks/useCustomers';
import { useCreateOtFromRepuestos, useRepuestosList, useUpdateRepuesto } from '@/hooks/useRepuestos';

const RepuestosSolicitadosPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [estado, setEstado] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [showOtModal, setShowOtModal] = useState(false);

  const repuestosQuery = useRepuestosList({ page, limit, estado, clienteId, search });
  const customersQuery = useCustomers({ page: 1, limit: 200 });
  const updateMutation = useUpdateRepuesto();
  const createOtMutation = useCreateOtFromRepuestos();

  const repuestos = repuestosQuery.data?.data || [];
  const pagination = repuestosQuery.data?.pagination;

  console.log('Repuestos:', repuestos);
  
  const selectableIds = useMemo(
    () => repuestos.filter((r: any) => (r.EstadoSolicitud || 'Solicitado') === 'Solicitado').map((r: any) => String(r._id)),
    [repuestos]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleStatusChange = async (id: string, value: any) => {
    const current = repuestos.find((r: any) => String(r._id) === id);
    const previous = statusOverrides[id] || current?.EstadoSolicitud || 'Solicitado';
    let rejectionComment = '';
    if (value === 'Rechazado') {
      rejectionComment = window.prompt('Ingrese motivo del rechazo:') || '';
    }

    setStatusOverrides((prev) => ({ ...prev, [id]: value }));
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          EstadoSolicitud: value,
          EstadoAnterior: previous,
          observacion: rejectionComment || undefined,
        },
      });
      toast.success('Estado actualizado correctamente');
    } catch (error: any) {
      setStatusOverrides((prev) => ({ ...prev, [id]: previous }));
      toast.error(error?.message || 'No se pudo actualizar el estado del repuesto');
    }
  };

  const handleOpenReport = (repuesto: any) => {
    const reportId = repuesto?.ReporteSolicitudId?._id || repuesto?.ReporteSolicitudId;
    if (!reportId) return;
    navigate(`/reports/${reportId}/view`);
  };

  const handleCreateOt = async (payload: {
    ResponsableId: string;
    FechaEstimadaEntrega?: string;
    observacion?: string;
    OtPrioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  }) => {
    try {
      const result = await createOtMutation.mutateAsync({ repuestoIds: selectedIds, payload });
      setShowOtModal(false);
      setSelectedIds([]);
      toast.success('OT creada exitosamente');
      const otId = result?.data?.ot?._id;
      if (otId) {
        navigate(`/ots/${otId}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo crear la OT desde solicitudes');
    }
  };

  const selectedItems = useMemo(
    () => repuestos
      .filter((r: any) => selectedIds.includes(String(r._id)))
      .map((r: any) => ({
        _id: String(r._id),
        nombre: r.nombre,
        equipoLabel: [r?.EquipoId?.item, r?.EquipoId?.Marca, r?.EquipoId?.Serie].filter(Boolean).join(' / '),
      })),
    [repuestos, selectedIds]
  );

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="h4 mb-1">Repuestos solicitados</h1>
          <p className="text-muted mb-0">Gestión global de repuestos por cliente, estado y búsqueda.</p>
        </Col>
        <Col xs="auto">
          {selectedIds.length > 0 && (
            <Button variant="primary" onClick={() => setShowOtModal(true)}>
              Crear OT ({selectedIds.length})
            </Button>
          )}
        </Col>
      </Row>

      <Row className="mb-3 g-2">
        <Col md={4}>
          <Form.Control
            placeholder="Buscar repuesto"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los clientes</option>
            {(customersQuery.data?.data || []).map((c: any) => (
              <option key={c._id} value={c._id}>{c.Razonsocial}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="Solicitado">Solicitado</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Instalado">Instalado</option>
            <option value="Rechazado">Rechazado</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </Form.Select>
        </Col>
      </Row>

      <Card className="tt-card">
        <Card.Body>
          {repuestosQuery.isLoading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th></th>
                    <th>Nombre</th>
                    <th>Equipo</th>
                    <th>Cliente</th>
                    <th>Fecha solicitud</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Solicitado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestos.map((r: any) => {
                    const id = String(r._id);
                    const isSelectable = selectableIds.includes(id);
                    const clienteNombre = r?.ClienteId?.Razonsocial || '-';
                    const solicitante = [r?.ResponsableSolicitud?.firstName, r?.ResponsableSolicitud?.lastName].filter(Boolean).join(' ') || '-';
                    const equipoTxt = [r?.EquipoId?.item, r?.EquipoId?.Marca, r?.EquipoId?.Serie].filter(Boolean).join(' / ') || '-';
                    return (
                      <tr key={id}>
                        <td>
                          <Form.Check
                            checked={selectedIds.includes(id)}
                            disabled={!isSelectable}
                            onChange={() => toggleSelection(id)}
                          />
                        </td>
                        <td role="button" onClick={() => handleOpenReport(r)}>{r.nombre}</td>
                        <td>{equipoTxt}</td>
                        <td>{clienteNombre}</td>
                        <td>{r.FechaSolicitud ? new Date(r.FechaSolicitud).toLocaleDateString() : '-'}</td>
                        <td style={{ minWidth: 160 }}>
                          <RepuestoStatusDropdown
                            value={statusOverrides[id] || r.EstadoSolicitud || 'Solicitado'}
                            disabled={true}
                            onChange={(value) => handleStatusChange(id, value)}
                          />
                        </td>
                        <td>{r.Prioridad || '-'}</td>
                        <td>{solicitante}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleOpenReport(r)}>
                            Ver reporte
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <Pagination page={pagination?.page || page} pages={pagination?.pages || 1} onChange={setPage} />
            </>
          )}
        </Card.Body>
      </Card>

      <CreateOtFromRepuestosModal
        show={showOtModal}
        onHide={() => setShowOtModal(false)}
        selectedCount={selectedIds.length}
        selectedItems={selectedItems}
        onSubmit={handleCreateOt}
        submitting={createOtMutation.isPending}
      />
    </Container>
  );
};

export default RepuestosSolicitadosPage;
