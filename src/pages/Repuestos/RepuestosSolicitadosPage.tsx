import React from 'react';
import { useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, OverlayTrigger, Row, Spinner, Table, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from '@/components/common/Pagination';
import RepuestoStatusDropdown from '@/components/repuestos/RepuestoStatusDropdown';
import CreateOtFromRepuestosModal from '@/components/repuestos/CreateOtFromRepuestosModal';
import RepuestoRequisicionBadge from '@/components/repuestos/RepuestoRequisicionBadge';
import HacerRequisicionModal from '@/pages/Requisiciones/components/HacerRequisicionModal';
import ReasonModal from '@/pages/Requisiciones/components/ReasonModal';
import ReqHelp from '@/pages/Requisiciones/help/ReqHelp';
import { PERMISSIONS } from '@/constants/permissions';
import { useTenantCapabilities } from '@/context/TenantCapabilitiesContext';
import { useCustomers } from '@/hooks/useCustomers';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import { REQUISICION_FILTRO_OPTIONS, canHacerRequisicion, isDisponible, isLinkedToRequisicion } from '@/utils/repuestoRequisicion';
import { useCreateOtFromRepuestos, useRepuestosList, useUpdateRepuesto } from '@/hooks/useRepuestos';

const RepuestosSolicitadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useTenantCapabilities();
  const managesCustomers = can('managesCustomers');
  // Requisiciones (premium): every addition below is gated on this flag; with it off the page is unchanged.
  const usesRequisiciones = can('usesRequisiciones');
  const { has } = useCurrentUserPermissions();
  const canCreateRequisicion = has(PERMISSIONS.REQUISICIONES_CREATE);
  const canManageAll = has(PERMISSIONS.REQUISICIONES_MANAGE_ALL);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [estado, setEstado] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [showOtModal, setShowOtModal] = useState(false);
  const [requisicionEstado, setRequisicionEstado] = useState('');
  const [showRequisicionModal, setShowRequisicionModal] = useState(false);
  const [showOmitirModal, setShowOmitirModal] = useState(false);
  const [motivoOmision, setMotivoOmision] = useState('');

  const repuestosQuery = useRepuestosList({
    page,
    limit,
    estado,
    clienteId,
    search,
    ...(usesRequisiciones && requisicionEstado ? { requisicionEstado } : {}),
  });
  const customersQuery = useCustomers({ page: 1, limit: 200 }, { enabled: managesCustomers });
  const updateMutation = useUpdateRepuesto();
  const createOtMutation = useCreateOtFromRepuestos();

  const repuestos = repuestosQuery.data?.data || [];
  const pagination = repuestosQuery.data?.pagination;

  console.log('Repuestos:', repuestos);
  
  const selectableIds = useMemo(
    () => repuestos.filter((r: any) => (r.EstadoSolicitud || 'Solicitado') === 'Solicitado').map((r: any) => String(r._id)),
    [repuestos]
  );

  const clienteIdOf = (r: any): string | null => {
    if (!r) return null;
    if (typeof r.ClienteId === 'string') return r.ClienteId;
    if (r.ClienteId?._id) return String(r.ClienteId._id);
    return null;
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      // Deselect always allowed.
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Same-client enforcement (mirrors backend MULTIPLE_CLIENTS rejection).
      // If the new row's client does not match the currently-selected client
      // set, block the selection and toast an explanation.
      if (prev.length > 0) {
        const currentCliente = clienteIdOf(repuestos.find((r: any) => String(r._id) === prev[0]));
        const nextRow = repuestos.find((r: any) => String(r._id) === id);
        const nextCliente = clienteIdOf(nextRow);
        if (currentCliente && nextCliente && currentCliente !== nextCliente) {
          toast.error('Solo puedes seleccionar repuestos del mismo cliente para crear una OT.');
          return prev;
        }
      }
      return [...prev, id];
    });
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
    responsableUserIds: string[];
    fechaInicio: string;
    fechaFin: string;
    nota?: string;
    OtPrioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  }) => {
    try {
      const result = await createOtMutation.mutateAsync({
        repuestoIds: selectedIds,
        payload: motivoOmision ? { ...payload, omitirRequisicion: true, motivoOmision } : payload,
      });
      setShowOtModal(false);
      setMotivoOmision('');
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

  const selectedRows = useMemo(
    () => repuestos.filter((r: any) => selectedIds.includes(String(r._id))),
    [repuestos, selectedIds]
  );

  // Requisiciones on: an OT is only created from available requests (the server enforces it too).
  const allDisponible = selectedRows.every((r: any) => isDisponible(r));
  const someUnlinked = selectedRows.some((r: any) => !isLinkedToRequisicion(r));
  const otBlockedReason =
    !usesRequisiciones || allDisponible
      ? null
      : someUnlinked
        ? 'Hay solicitudes sin requisición. Haz una requisición y espera a que queden disponibles para crear la OT.'
        : 'Hay solicitudes cuya requisición aún no está disponible. Se habilitan cuando el solicitante confirma la recepción.';
  const canMakeRequisicion = selectedRows.length > 0 && selectedRows.every((r: any) => canHacerRequisicion(r));

  const solicitudesParaRequisicion = selectedRows.map((r: any) => ({
    _id: String(r._id),
    nombre: r.nombre,
    Cantidad: r.Cantidad,
    PrecioRepuesto: r.PrecioRepuesto,
    Prioridad: r.Prioridad,
  }));

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1 className="h4 mb-1">Repuestos solicitados</h1>
          <p className="text-muted mb-0">Gestión global de repuestos por cliente, estado y búsqueda.</p>
        </Col>
        <Col xs="auto" className={usesRequisiciones ? 'd-flex flex-wrap align-items-center justify-content-end gap-2' : undefined}>
          {usesRequisiciones && selectedIds.length > 0 && canCreateRequisicion && (
            <>
              <OverlayTrigger
                placement="bottom"
                overlay={
                  <Tooltip id="tt-hacer-requisicion">
                    {canMakeRequisicion
                      ? 'Crear una requisición con las solicitudes seleccionadas.'
                      : 'Solo puedes incluir solicitudes sin requisición.'}
                  </Tooltip>
                }
              >
                <span className="d-inline-block">
                  <Button
                    variant="outline-primary"
                    disabled={!canMakeRequisicion}
                    onClick={() => setShowRequisicionModal(true)}
                  >
                    Hacer requisición ({selectedIds.length})
                  </Button>
                </span>
              </OverlayTrigger>
              <ReqHelp id="solicitudes.hacerRequisicion" placement="bottom" className="ms-0" />
            </>
          )}
          {selectedIds.length > 0 && can('executesServices') && (
            <>
              <Button variant="primary" onClick={() => setShowOtModal(true)} disabled={!!otBlockedReason}>
                Crear OT ({selectedIds.length})
              </Button>
              {usesRequisiciones && <ReqHelp id="solicitudes.crearOt" placement="bottom" className="ms-0" />}
              {otBlockedReason && canManageAll && (
                <>
                  <Button variant="outline-warning" onClick={() => setShowOmitirModal(true)}>
                    Crear OT sin requisición
                  </Button>
                  <ReqHelp id="solicitudes.omitir" placement="bottom" className="ms-0" />
                </>
              )}
            </>
          )}
        </Col>
        {otBlockedReason && selectedIds.length > 0 && can('executesServices') && (
          <Col xs={12}>
            <small className="text-muted d-block text-end" role="note">
              {otBlockedReason}
            </small>
          </Col>
        )}
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
        {managesCustomers && (
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
        )}
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
        {usesRequisiciones && (
          <Col md={3} className="d-flex align-items-center gap-1">
            <Form.Select
              aria-label="Filtrar por requisición"
              value={requisicionEstado}
              onChange={(e) => {
                setRequisicionEstado(e.target.value);
                setPage(1);
              }}
            >
              {REQUISICION_FILTRO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Form.Select>
            <ReqHelp id="solicitudes.filtro" className="ms-0" />
          </Col>
        )}
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
                    {managesCustomers && <th>Cliente</th>}
                    <th>Fecha solicitud</th>
                    <th>Estado</th>
                    {usesRequisiciones && (
                      <th>
                        Requisición
                        <ReqHelp id="solicitudes.columna" />
                      </th>
                    )}
                    <th>Prioridad</th>
                    <th>Solicitado por</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {repuestos.map((r: any) => {
                    const id = String(r._id);
                    // Disable rows of a DIFFERENT client once the user has
                    // started a selection (same-client rule). Enforced on the
                    // server too — this is UX guidance.
                    const otherClienteSelected = selectedIds.length > 0
                      && !selectedIds.includes(id)
                      && (() => {
                        const currentCliente = clienteIdOf(repuestos.find((rr: any) => String(rr._id) === selectedIds[0]));
                        const rowCliente = clienteIdOf(r);
                        return Boolean(currentCliente && rowCliente && currentCliente !== rowCliente);
                      })();
                    const isSelectable = selectableIds.includes(id) && !otherClienteSelected;
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
                        {managesCustomers && <td>{clienteNombre}</td>}
                        <td>{r.FechaSolicitud ? new Date(r.FechaSolicitud).toLocaleDateString() : '-'}</td>
                        <td style={{ minWidth: 160 }}>
                          <RepuestoStatusDropdown
                            value={statusOverrides[id] || r.EstadoSolicitud || 'Solicitado'}
                            disabled={true}
                            onChange={(value) => handleStatusChange(id, value)}
                          />
                        </td>
                        {usesRequisiciones && (
                          <td>
                            <RepuestoRequisicionBadge repuesto={r} />
                          </td>
                        )}
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
        onHide={() => {
          setShowOtModal(false);
          setMotivoOmision('');
        }}
        selectedCount={selectedIds.length}
        selectedItems={selectedItems}
        onSubmit={handleCreateOt}
        submitting={createOtMutation.isPending}
      />

      {usesRequisiciones && (
        <>
          <HacerRequisicionModal
            show={showRequisicionModal}
            onHide={() => setShowRequisicionModal(false)}
            solicitudes={solicitudesParaRequisicion}
            onCreated={() => setSelectedIds([])}
          />
          <ReasonModal
            show={showOmitirModal}
            title="Crear OT sin requisición"
            label="Motivo de la excepción"
            confirmLabel="Continuar"
            confirmVariant="warning"
            helpId="solicitudes.omitir"
            onConfirm={(text) => {
              setMotivoOmision(text);
              setShowOmitirModal(false);
              setShowOtModal(true);
            }}
            onHide={() => setShowOmitirModal(false)}
          />
        </>
      )}
    </Container>
  );
};

export default RepuestosSolicitadosPage;
