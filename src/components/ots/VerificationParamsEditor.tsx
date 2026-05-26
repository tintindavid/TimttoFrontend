import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import { VerificationParam, VERIFICATION_PARAM_LIMITS } from '@/types/reporte.types';
import { useUpdateVerificationParams } from '@/hooks/useReportes';

interface VerificationParamsEditorProps {
  reporteId: string;
  value: VerificationParam[];
  disabled?: boolean;
  onDirtyChange?: (isDirty: boolean) => void;
  onSaved?: (value: VerificationParam[]) => void;
}

interface RowDraft {
  localId: string;
  _id?: string;
  magnitud: string;
  unidad: string;
  valorReferencia: string;
  valorMedido: string;
  patron: string;
}

let rowKeyCounter = 0;
const nextLocalId = () => `vp-row-${++rowKeyCounter}-${Date.now()}`;

const toDraft = (row: VerificationParam): RowDraft => ({
  localId: nextLocalId(),
  _id: row._id,
  magnitud: row.magnitud ?? '',
  unidad: row.unidad ?? '',
  valorReferencia: row.valorReferencia === null || row.valorReferencia === undefined ? '' : String(row.valorReferencia),
  valorMedido: row.valorMedido === null || row.valorMedido === undefined ? '' : String(row.valorMedido),
  patron: row.patron ?? '',
});

const fromDraft = (draft: RowDraft): VerificationParam => ({
  ...(draft._id ? { _id: draft._id } : {}),
  magnitud: draft.magnitud,
  unidad: draft.unidad,
  valorReferencia: draft.valorReferencia.trim() === '' ? null : Number(draft.valorReferencia),
  valorMedido: draft.valorMedido.trim() === '' ? null : Number(draft.valorMedido),
  patron: draft.patron,
});

const serialize = (drafts: RowDraft[]) =>
  JSON.stringify(
    drafts.map((d) => ({
      _id: d._id ?? null,
      magnitud: d.magnitud,
      unidad: d.unidad,
      valorReferencia: d.valorReferencia,
      valorMedido: d.valorMedido,
      patron: d.patron,
    }))
  );

// Stable content signature for the incoming `value`. Used to decide when an
// external change really happened (vs. the parent passing a brand-new `[]`
// literal on every render via `value={obj.field ?? []}`).
const valueSignature = (value: VerificationParam[]): string =>
  JSON.stringify(
    value.map((r) => ({
      _id: r._id ?? null,
      magnitud: r.magnitud ?? '',
      unidad: r.unidad ?? '',
      valorReferencia: r.valorReferencia ?? null,
      valorMedido: r.valorMedido ?? null,
      patron: r.patron ?? '',
    }))
  );

const VerificationParamsEditor: React.FC<VerificationParamsEditorProps> = ({
  reporteId,
  value,
  disabled = false,
  onDirtyChange,
  onSaved,
}) => {
  const [drafts, setDrafts] = useState<RowDraft[]>(() => value.map(toDraft));
  const [baseline, setBaseline] = useState<string>(() => serialize(value.map(toDraft)));
  const [error, setError] = useState<string | null>(null);

  // Reset only when the *content* of `value` actually changes — not when the
  // parent re-renders and creates a new array reference with the same content.
  const incomingSignature = valueSignature(value);
  useEffect(() => {
    const fresh = value.map(toDraft);
    setDrafts(fresh);
    setBaseline(serialize(fresh));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSignature]);

  const updateMutation = useUpdateVerificationParams();
  const isSaving = updateMutation.isLoading;

  const isDirty = serialize(drafts) !== baseline;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleAddRow = useCallback(() => {
    setDrafts((prev) => {
      const last = prev[prev.length - 1];
      const cascade: RowDraft = {
        localId: nextLocalId(),
        magnitud: last?.magnitud ?? '',
        unidad: last?.unidad ?? '',
        valorReferencia: '',
        valorMedido: '',
        patron: last?.patron ?? '',
      };
      return [...prev, cascade];
    });
  }, []);

  const handleChangeRow = useCallback(
    (localId: string, field: keyof Omit<RowDraft, 'localId' | '_id'>, raw: string) => {
      setDrafts((prev) =>
        prev.map((row) => (row.localId === localId ? { ...row, [field]: raw } : row))
      );
    },
    []
  );

  const handleDeleteRow = useCallback((localId: string) => {
    setDrafts((prev) => prev.filter((row) => row.localId !== localId));
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);

    const overflows: string[] = [];
    drafts.forEach((row, index) => {
      if (row.magnitud.length > VERIFICATION_PARAM_LIMITS.MAX_MAGNITUD_LENGTH)
        overflows.push(`fila ${index + 1}: magnitud excede ${VERIFICATION_PARAM_LIMITS.MAX_MAGNITUD_LENGTH} caracteres`);
      if (row.unidad.length > VERIFICATION_PARAM_LIMITS.MAX_UNIDAD_LENGTH)
        overflows.push(`fila ${index + 1}: unidad excede ${VERIFICATION_PARAM_LIMITS.MAX_UNIDAD_LENGTH} caracteres`);
      if (row.patron.length > VERIFICATION_PARAM_LIMITS.MAX_PATRON_LENGTH)
        overflows.push(`fila ${index + 1}: patrón excede ${VERIFICATION_PARAM_LIMITS.MAX_PATRON_LENGTH} caracteres`);
      if (row.valorReferencia.trim() !== '' && !Number.isFinite(Number(row.valorReferencia)))
        overflows.push(`fila ${index + 1}: V. Ref debe ser un número`);
      if (row.valorMedido.trim() !== '' && !Number.isFinite(Number(row.valorMedido)))
        overflows.push(`fila ${index + 1}: V. Medido debe ser un número`);
    });

    if (overflows.length > 0) {
      setError(overflows.join(' · '));
      return;
    }

    const payload = drafts.map(fromDraft);

    try {
      const response = await updateMutation.mutateAsync({
        reporteId,
        verificationParam: payload,
      });
      const persisted = (response as any)?.data?.verificationParam ?? payload;
      const fresh = (persisted as VerificationParam[]).map(toDraft);
      setDrafts(fresh);
      setBaseline(serialize(fresh));
      onSaved?.(persisted as VerificationParam[]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error guardando los parámetros');
    }
  }, [drafts, reporteId, updateMutation, onSaved]);

  return (
    <Card>
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        <div className="table-responsive">
          <Table bordered hover size="sm" className="align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ minWidth: 160 }}>Magnitud</th>
                <th style={{ minWidth: 90 }}>Unidad</th>
                <th style={{ minWidth: 100 }}>V. Ref</th>
                <th style={{ minWidth: 100 }}>V. Medido</th>
                <th style={{ minWidth: 160 }}>Patrón</th>
                <th style={{ width: 48 }} aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {drafts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Sin parámetros. Agrega uno con el botón inferior.
                  </td>
                </tr>
              )}
              {drafts.map((row) => (
                <tr key={row.localId}>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={row.magnitud}
                      onChange={(e) => handleChangeRow(row.localId, 'magnitud', e.target.value)}
                      maxLength={VERIFICATION_PARAM_LIMITS.MAX_MAGNITUD_LENGTH}
                      disabled={disabled}
                      aria-label="Magnitud"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={row.unidad}
                      onChange={(e) => handleChangeRow(row.localId, 'unidad', e.target.value)}
                      maxLength={VERIFICATION_PARAM_LIMITS.MAX_UNIDAD_LENGTH}
                      disabled={disabled}
                      aria-label="Unidad"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      inputMode="decimal"
                      size="sm"
                      value={row.valorReferencia}
                      onChange={(e) => handleChangeRow(row.localId, 'valorReferencia', e.target.value)}
                      disabled={disabled}
                      aria-label="Valor de referencia"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      inputMode="decimal"
                      size="sm"
                      value={row.valorMedido}
                      onChange={(e) => handleChangeRow(row.localId, 'valorMedido', e.target.value)}
                      disabled={disabled}
                      aria-label="Valor medido"
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={row.patron}
                      onChange={(e) => handleChangeRow(row.localId, 'patron', e.target.value)}
                      maxLength={VERIFICATION_PARAM_LIMITS.MAX_PATRON_LENGTH}
                      disabled={disabled}
                      aria-label="Patrón"
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteRow(row.localId)}
                      disabled={disabled}
                      aria-label={`Eliminar fila`}
                      title="Eliminar fila"
                    >
                      <FaTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleAddRow}
            disabled={disabled}
          >
            <FaPlus className="me-1" /> Agregar parámetro
          </Button>

          <div className="d-flex align-items-center gap-2">
            {isDirty && !isSaving && (
              <span className="text-warning small">Cambios sin guardar</span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={disabled || !isDirty || isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" /> Guardando…
                </>
              ) : (
                <>
                  <FaSave className="me-1" /> Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default VerificationParamsEditor;
