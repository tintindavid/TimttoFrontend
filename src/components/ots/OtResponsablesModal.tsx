import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Col, Collapse, Form, Modal, Row, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { useOtProgramaciones, useSetOtProgramacion } from '@/hooks/useOTs';
import { useUsersEligibleFor } from '@/hooks/useUsers';
import { PERMISSIONS } from '@/constants/permissions';

interface OtResponsablesModalProps {
  show: boolean;
  onHide: () => void;
  /** `null` means "no OT selected" — modal stays hidden. */
  otId: string | null;
}

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');

/** yyyy-mm-dd + N days, staying in local calendar days (no timezone drift for date-only inputs). */
const addDays = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Programación management modal — opened from the OT list's "Responsables"
 * dropdown item (ots:manage-responsables). Shows the active roster + dates,
 * an editable multi-select of eligible users, and a collapsible read-only
 * history of previous entries (design.md D14).
 */
const OtResponsablesModal: React.FC<OtResponsablesModalProps> = ({ show, onHide, otId }) => {
  const { data: programacionesResponse, isLoading: loadingProgramaciones } = useOtProgramaciones(
    show ? otId : null,
  );
  const { data: usersResponse, isLoading: loadingUsers } = useUsersEligibleFor(
    PERMISSIONS.OTS_CAN_BE_RESPONSIBLE,
  );
  const setProgramacion = useSetOtProgramacion();

  const programaciones = programacionesResponse?.data || [];
  const activeEntry = useMemo(() => programaciones.find((p) => p.isActive), [programaciones]);

  const userOptions = useMemo(
    () =>
      (usersResponse?.data || []).map((u) => ({
        value: u._id as string,
        label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      })),
    [usersResponse],
  );

  const [responsableIds, setResponsableIds] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [startDateChanged, setStartDateChanged] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Pre-load from the active entry every time the modal opens for a given OT
  // (or once its data arrives). Resets local edits so a re-open doesn't leak
  // a previous OT's draft.
  useEffect(() => {
    if (!show) return;
    setResponsableIds(activeEntry?.responsables.map((r) => r.userId) || []);
    setFechaInicio(toDateInputValue(activeEntry?.fechaInicio));
    setFechaFin(toDateInputValue(activeEntry?.fechaFin));
    setStartDateChanged(false);
    setShowHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, otId, activeEntry?._id]);

  const today = todayStr();
  // D14: min becomes "today" only once the user touches the picker — an
  // unchanged past fechaInicio (edit that only moves fechaFin) is preserved.
  const minFechaInicio = startDateChanged ? today : undefined;
  const minFechaFin = fechaInicio ? addDays(fechaInicio, 1) : undefined;

  const isStartInvalid = startDateChanged && fechaInicio !== '' && fechaInicio < today;
  const isRangeInvalid = Boolean(fechaInicio && fechaFin && fechaFin <= fechaInicio);
  const isSaving = setProgramacion.isLoading;

  const canSubmit =
    responsableIds.length > 0 && Boolean(fechaInicio) && Boolean(fechaFin) && !isStartInvalid && !isRangeInvalid && !isSaving;

  const handleSubmit = async () => {
    if (!otId || !canSubmit) return;
    try {
      await setProgramacion.mutateAsync({
        otId,
        data: { fechaInicio, fechaFin, responsableUserIds: responsableIds },
      });
      onHide();
    } catch {
      // Toast surfaced by useSetOtProgramacion's onError — keep the modal
      // open so the admin can fix the roster/dates and retry.
    }
  };

  const isLoading = loadingProgramaciones || loadingUsers;

  return (
    <Modal show={show && Boolean(otId)} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Responsables de la OT</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" aria-label="Cargando programación" />
          </div>
        ) : (
          <>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Label htmlFor="ot-programacion-fecha-inicio">Fecha inicio</Form.Label>
                <Form.Control
                  id="ot-programacion-fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  min={minFechaInicio}
                  onChange={(e) => {
                    setStartDateChanged(true);
                    setFechaInicio(e.target.value);
                  }}
                  isInvalid={isStartInvalid}
                />
                {isStartInvalid && (
                  <Form.Text className="text-danger">La fecha de inicio no puede ser anterior a hoy.</Form.Text>
                )}
              </Col>
              <Col md={6}>
                <Form.Label htmlFor="ot-programacion-fecha-fin">Fecha fin</Form.Label>
                <Form.Control
                  id="ot-programacion-fecha-fin"
                  type="date"
                  value={fechaFin}
                  min={minFechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  isInvalid={isRangeInvalid}
                />
                {isRangeInvalid && (
                  <Form.Text className="text-danger">La fecha fin debe ser posterior a la fecha de inicio.</Form.Text>
                )}
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label htmlFor="ot-programacion-responsables">Responsables</Form.Label>
              <Select
                inputId="ot-programacion-responsables"
                isMulti
                options={userOptions}
                value={userOptions.filter((opt) => responsableIds.includes(opt.value))}
                onChange={(selected) => setResponsableIds(selected.map((s) => s.value))}
                placeholder="Seleccionar responsables..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // The Bootstrap modal uses z-index 1055; react-select's portal
                // defaults to z-index 1, which renders the dropdown BEHIND
                // the modal and looks like "nothing happens" even though the
                // select is functional (typing + Enter still picks options).
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                aria-label="Responsables"
                noOptionsMessage={() => 'No hay usuarios elegibles (permiso ots:can-be-responsible)'}
              />
              {responsableIds.length === 0 && (
                <Form.Text className="text-muted">Debes asignar al menos un responsable.</Form.Text>
              )}
            </Form.Group>

            <Button
              variant="link"
              className="ps-0 mb-2"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              aria-controls="ot-programacion-historial"
            >
              {showHistory ? 'Ocultar historial de programación' : 'Ver historial de programación'}
            </Button>
            <Collapse in={showHistory} unmountOnExit>
              <div id="ot-programacion-historial">
                {programaciones.length === 0 ? (
                  <Alert variant="light" className="small text-muted">
                    Esta OT aún no tiene programaciones registradas.
                  </Alert>
                ) : (
                  <div className="border rounded p-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {programaciones.map((entry) => (
                      <div key={entry._id} className="border-bottom pb-2 mb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="fw-semibold">
                            {toDateInputValue(entry.fechaInicio)} → {toDateInputValue(entry.fechaFin)}
                          </small>
                          {entry.isActive && (
                            <Badge bg="success" className="ms-2">
                              Activa
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1">
                          {entry.responsables.map((r) => (
                            <Badge bg="secondary" className="me-1 mb-1" key={r.userId}>
                              {r.snapshotName}
                            </Badge>
                          ))}
                        </div>
                        <small className="text-muted">
                          Asignado por {entry.createdByName || 'Sistema'}
                          {entry.createdAt ? ` · ${new Date(entry.createdAt).toLocaleString('es-CO')}` : ''}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Collapse>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {isSaving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OtResponsablesModal;
