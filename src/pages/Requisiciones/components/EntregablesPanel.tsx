import React, { useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Spinner, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { PERMISSIONS } from '@/constants/permissions';
import { useCurrentUserPermissions } from '@/hooks/usePermission';
import {
  useAceptarEntregables,
  useDevolverEntregables,
  useMarcarEntregablesRecibidos,
  useRevisarEntregables,
  useSubirEntregables,
} from '@/hooks/useOrdenCompra';
import {
  ENTREGA_ESTADO_LABELS,
  ENTREGA_ESTADO_VARIANT,
  ENTREGABLE_ACCEPT,
  ENTREGABLE_MAX_BYTES,
  ENTREGABLE_MAX_FILES,
  ENTREGABLE_TIPOS_MENSAJE,
  ENTREGABLE_TIPOS_PERMITIDOS,
  type OrdenCompraEntrega,
} from '@/types/ordenCompra.types';
import type { Requisicion } from '@/types/requisicion.types';
import { formatDateTime, isSafeHttpsUrl } from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';
import ReqHelp from '../help/ReqHelp';
import ReasonModal from './ReasonModal';

interface Props {
  requisicion: Requisicion;
}

/** Estados in which the supplier (or a user on their behalf) can still upload supports. */
const UPLOAD_ESTADOS = ['OC_Enviada', 'En_Recepcion'];

/** Client-side hint for a file list; the server validates by signature and is the authority. */
const filesError = (files: File[]): string => {
  if (files.length > ENTREGABLE_MAX_FILES) return `Máximo ${ENTREGABLE_MAX_FILES} archivos por envío.`;
  if (files.some((f) => !ENTREGABLE_TIPOS_PERMITIDOS.includes(f.type))) return ENTREGABLE_TIPOS_MENSAJE;
  if (files.some((f) => f.size > ENTREGABLE_MAX_BYTES)) return 'Cada archivo debe pesar máximo 5 MB.';
  return '';
};

/** "Entregables del proveedor" panel: state, files with who/when, and the review cycle for who manages deliverables. */
const EntregablesPanel: React.FC<Props> = ({ requisicion }) => {
  const { has } = useCurrentUserPermissions();
  const canManage = has(PERMISSIONS.REQUISICIONES_MANAGE_DELIVERABLES);
  const subir = useSubirEntregables();
  const marcar = useMarcarEntregablesRecibidos();
  const revisar = useRevisarEntregables();
  const aceptar = useAceptarEntregables();
  const devolver = useDevolverEntregables();

  const [files, setFiles] = useState<File[]>([]);
  const [showDevolver, setShowDevolver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const oc = requisicion.ordenCompra;
  const entrega: OrdenCompraEntrega = oc?.entrega ?? { estado: 'Pendiente' };
  const archivos = entrega.archivos ?? [];
  const estadoEntrega = entrega.estado;
  const canUpload = canManage && UPLOAD_ESTADOS.includes(requisicion.estado) && ['Pendiente', 'Recibidos', 'Devolucion'].includes(estadoEntrega);
  const busy = subir.isLoading || marcar.isLoading || revisar.isLoading || aceptar.isLoading || devolver.isLoading;
  const fileError = filesError(files);

  const run = async (action: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await action();
      toast.success(ok);
      return true;
    } catch (err) {
      toast.error(getRequisicionErrorMessage(err, fallback));
      return false;
    }
  };

  const handleSubir = async () => {
    if (files.length === 0 || fileError) return;
    const ok = await run(
      () => subir.mutateAsync({ id: requisicion._id, archivos: files }),
      'Soportes adjuntados.',
      'No fue posible adjuntar los soportes.'
    );
    if (ok) {
      setFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDevolver = async (observacion: string) => {
    const ok = await run(
      () => devolver.mutateAsync({ id: requisicion._id, data: { observacion } }),
      'Entregables devueltos al proveedor.',
      'No fue posible devolver los entregables.'
    );
    if (ok) setShowDevolver(false);
  };

  return (
    <Card className="tt-card mb-3" data-testid="entregables-panel">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0">
          Entregables del proveedor
          <ReqHelp id="entregables.panel" />
        </h2>
        <Badge bg={ENTREGA_ESTADO_VARIANT[estadoEntrega] ?? 'secondary'}>{ENTREGA_ESTADO_LABELS[estadoEntrega] ?? estadoEntrega}</Badge>
      </Card.Header>
      <Card.Body>
        {estadoEntrega === 'Devolucion' && entrega.ultimaObservacion && (
          <Alert variant="danger" className="py-2" data-testid="entregables-observacion">
            <strong>Última observación de devolución:</strong> {entrega.ultimaObservacion}
          </Alert>
        )}
        {estadoEntrega === 'Aceptados' && (
          <Alert variant="success" className="py-2">
            Los entregables fueron aceptados.
          </Alert>
        )}

        {archivos.length === 0 ? (
          <p className="text-muted">El proveedor aún no ha entregado soportes.</p>
        ) : (
          <div className="table-responsive">
            <Table size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Subido por</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {archivos.map((a, index) => (
                  <tr key={`${a.url}-${index}`}>
                    <td>
                      {isSafeHttpsUrl(a.url) ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer">
                          {a.nombre || 'Archivo'}
                        </a>
                      ) : (
                        a.nombre || 'Archivo'
                      )}
                    </td>
                    <td>{a.subidoPor === 'proveedor' ? 'Proveedor' : 'Usuario interno'}</td>
                    <td>{formatDateTime(a.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {canUpload && (
          <Form.Group className="mb-3" controlId="entregables-archivos">
            <Form.Label>Adjuntar en nombre del proveedor (PDF o imágenes JPG, PNG, WEBP; máx. 5 MB cada uno)</Form.Label>
            <div className="d-flex flex-wrap gap-2 align-items-start">
              <div className="flex-grow-1">
                <Form.Control
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ENTREGABLE_ACCEPT}
                  isInvalid={!!fileError}
                  onChange={(e) => setFiles(Array.from((e.target as HTMLInputElement).files ?? []))}
                />
                <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
              </div>
              <Button variant="outline-primary" onClick={handleSubir} disabled={files.length === 0 || !!fileError || busy}>
                {subir.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                Adjuntar
              </Button>
            </div>
          </Form.Group>
        )}

        {canManage && (
          <div className="d-flex flex-wrap gap-2">
            {estadoEntrega === 'Pendiente' && archivos.length === 0 && UPLOAD_ESTADOS.includes(requisicion.estado) && (
              <Button
                variant="outline-primary"
                onClick={() => run(() => marcar.mutateAsync(requisicion._id), 'Entregables marcados como recibidos.', 'No fue posible marcar los entregables.')}
                disabled={busy}
              >
                Marcar como recibidos
              </Button>
            )}
            {estadoEntrega === 'Recibidos' && (
              <Button
                variant="warning"
                onClick={() => run(() => revisar.mutateAsync(requisicion._id), 'Entregables en revisión.', 'No fue posible iniciar la revisión.')}
                disabled={busy}
              >
                Iniciar revisión
              </Button>
            )}
            {estadoEntrega === 'En_Revision' && (
              <>
                <Button
                  variant="success"
                  onClick={() => run(() => aceptar.mutateAsync(requisicion._id), 'Entregables aceptados.', 'No fue posible aceptar los entregables.')}
                  disabled={busy}
                >
                  {aceptar.isLoading && <Spinner as="span" size="sm" animation="border" className="me-2" />}
                  Aceptar entregables
                </Button>
                <span className="d-inline-flex align-items-center gap-1">
                  <Button variant="outline-danger" onClick={() => setShowDevolver(true)} disabled={busy}>
                    Devolver al proveedor
                  </Button>
                  <ReqHelp id="accion.devolverEntregables" placement="bottom" className="ms-0" />
                </span>
              </>
            )}
          </div>
        )}
      </Card.Body>

      <ReasonModal
        show={showDevolver}
        title="Devolver entregables"
        label="Observación para el proveedor"
        confirmLabel="Devolver"
        confirmVariant="danger"
        isSubmitting={devolver.isLoading}
        onConfirm={handleDevolver}
        onHide={() => setShowDevolver(false)}
      />
    </Card>
  );
};

export default EntregablesPanel;
