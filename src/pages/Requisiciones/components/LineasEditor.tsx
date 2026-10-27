import React, { useState } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import Select from 'react-select';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useDebounce } from '@/hooks/useDebounce';
import { useInventarioList } from '@/hooks/useInventarioRepuestos';
import type { InventarioRepuesto } from '@/types/inventarioRepuesto.types';
import { computeMontoTotal, formatMoney } from '@/utils/requisicion.utils';
import ReqHelp from '../help/ReqHelp';

export const MAX_LINEAS = 100;

export type LineaFuente = 'stock' | 'libre';

export interface LineaFormValues {
  fuente: LineaFuente;
  inventarioItemId?: string | null;
  descripcion: string;
  especificaciones?: string;
  unidad: string;
  cantidadSolicitada: number;
  precioEstimado: number;
}

export interface RequisicionFormValues {
  titulo: string;
  tipoRequisicionId: string;
  areaId: string;
  prioridad: string;
  fechaRequerida?: string;
  justificacion?: string;
  lineas: LineaFormValues[];
}

export const emptyLinea = (fuente: LineaFuente = 'libre'): LineaFormValues => ({
  fuente,
  inventarioItemId: null,
  descripcion: '',
  especificaciones: '',
  unidad: 'und',
  cantidadSolicitada: 1,
  precioEstimado: 0,
});

interface StockOption {
  value: string;
  label: string;
  /** Absent for the placeholder option that represents an already-saved selection. */
  item?: InventarioRepuesto;
}

interface StockSelectProps {
  inputId: string;
  ariaLabel: string;
  selectedId?: string | null;
  selectedLabel?: string;
  onSelect: (item: InventarioRepuesto) => void;
}

/** Searchable picker of stock items (server-side search, debounced). Only rendered with `usesInventoryBasic`. */
const StockItemSelect: React.FC<StockSelectProps> = ({ inputId, ariaLabel, selectedId, selectedLabel, onSelect }) => {
  const [input, setInput] = useState('');
  const debounced = useDebounce(input, 300);
  const { data, isFetching } = useInventarioList({ search: debounced.trim() || undefined, limit: 20, activo: true });

  const options: StockOption[] = (data?.data ?? [])
    .filter((item): item is InventarioRepuesto & { _id: string } => !!item._id)
    .map((item) => ({
      value: item._id,
      label: item.referencia ? `${item.nombre} (${item.referencia})` : item.nombre,
      item,
    }));

  const value = selectedId ? { value: selectedId, label: selectedLabel || 'Ítem de stock' } : null;

  return (
    <Select<StockOption>
      inputId={inputId}
      aria-label={ariaLabel}
      classNamePrefix="react-select"
      placeholder="Buscar ítem de stock..."
      noOptionsMessage={() => 'Sin resultados'}
      loadingMessage={() => 'Buscando...'}
      isLoading={isFetching}
      options={options}
      value={value}
      // Filtering is done by the server, not by react-select.
      filterOption={null}
      onInputChange={(text, meta) => {
        if (meta.action === 'input-change') setInput(text);
      }}
      onChange={(opt) => opt?.item && onSelect(opt.item)}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1060 }) }}
    />
  );
};

interface Props {
  /** True when the tenant has `usesInventoryBasic`: enables the stock item picker. */
  canUseStock: boolean;
  currency?: string;
}

/** Dynamic list of requisicion lines (stock item or free text) with a live total. */
const LineasEditor: React.FC<Props> = ({ canUseStock, currency }) => {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<RequisicionFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'lineas' });
  const watched = useWatch({ control, name: 'lineas' }) ?? [];
  const total = computeMontoTotal(watched);
  const lineasError = (errors.lineas as { message?: string; root?: { message?: string } } | undefined);

  const handleSelectItem = (index: number, item: InventarioRepuesto) => {
    setValue(`lineas.${index}.inventarioItemId`, item._id ?? null, { shouldValidate: true });
    setValue(`lineas.${index}.descripcion`, item.nombre, { shouldValidate: true });
    if (item.unidad) setValue(`lineas.${index}.unidad`, item.unidad, { shouldValidate: true });
    if (typeof item.precio === 'number') setValue(`lineas.${index}.precioEstimado`, item.precio, { shouldValidate: true });
  };

  const handleFuenteChange = (index: number, fuente: LineaFuente) => {
    setValue(`lineas.${index}.fuente`, fuente);
    if (fuente === 'libre') setValue(`lineas.${index}.inventarioItemId`, null);
  };

  return (
    <div>
      {fields.map((field, index) => {
        const lineErrors = errors.lineas?.[index];
        const fuente = watched[index]?.fuente ?? field.fuente;
        const itemId = watched[index]?.inventarioItemId ?? field.inventarioItemId;
        return (
          <Card key={field.id} className="mb-3" data-testid="linea-row">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Línea {index + 1}</strong>
                <Button
                  variant="outline-danger"
                  size="sm"
                  type="button"
                  aria-label={`Quitar línea ${index + 1}`}
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <FaTrash />
                </Button>
              </div>

              {canUseStock && (
                <div className="mb-2">
                  <Form.Check
                    inline
                    type="radio"
                    id={`linea-${index}-libre`}
                    label="Texto libre"
                    checked={fuente === 'libre'}
                    onChange={() => handleFuenteChange(index, 'libre')}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    id={`linea-${index}-stock`}
                    label="Ítem de stock"
                    checked={fuente === 'stock'}
                    onChange={() => handleFuenteChange(index, 'stock')}
                  />
                  <ReqHelp id="form.fuente" />
                </div>
              )}

              <Row className="g-2">
                {canUseStock && fuente === 'stock' && (
                  <Col xs={12}>
                    <Form.Label htmlFor={`linea-${index}-item`}>Ítem de stock *</Form.Label>
                    <StockItemSelect
                      inputId={`linea-${index}-item`}
                      ariaLabel={`Ítem de stock de la línea ${index + 1}`}
                      selectedId={itemId}
                      selectedLabel={getValues(`lineas.${index}.descripcion`)}
                      onSelect={(item) => handleSelectItem(index, item)}
                    />
                    {!itemId && <Form.Text className="text-muted">Selecciona un ítem o cambia a texto libre.</Form.Text>}
                  </Col>
                )}
                <Col md={6}>
                  <Form.Label htmlFor={`linea-${index}-descripcion`}>Descripción *</Form.Label>
                  <ReqHelp id="form.descripcionLinea" />
                  <Form.Control
                    id={`linea-${index}-descripcion`}
                    maxLength={300}
                    isInvalid={!!lineErrors?.descripcion}
                    {...register(`lineas.${index}.descripcion`)}
                  />
                  <Form.Control.Feedback type="invalid">{lineErrors?.descripcion?.message}</Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label htmlFor={`linea-${index}-especificaciones`}>Especificaciones</Form.Label>
                  <Form.Control
                    id={`linea-${index}-especificaciones`}
                    maxLength={1000}
                    {...register(`lineas.${index}.especificaciones`)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label htmlFor={`linea-${index}-cantidad`}>Cantidad *</Form.Label>
                  <ReqHelp id="form.cantidadUnidad" />
                  <Form.Control
                    id={`linea-${index}-cantidad`}
                    type="number"
                    step="any"
                    min={0}
                    isInvalid={!!lineErrors?.cantidadSolicitada}
                    {...register(`lineas.${index}.cantidadSolicitada`, { valueAsNumber: true })}
                  />
                  <Form.Control.Feedback type="invalid">{lineErrors?.cantidadSolicitada?.message}</Form.Control.Feedback>
                </Col>
                <Col md={3}>
                  <Form.Label htmlFor={`linea-${index}-unidad`}>Unidad *</Form.Label>
                  <Form.Control
                    id={`linea-${index}-unidad`}
                    maxLength={30}
                    isInvalid={!!lineErrors?.unidad}
                    {...register(`lineas.${index}.unidad`)}
                  />
                  <Form.Control.Feedback type="invalid">{lineErrors?.unidad?.message}</Form.Control.Feedback>
                </Col>
                <Col md={3}>
                  <Form.Label htmlFor={`linea-${index}-precio`}>Precio estimado (unitario) *</Form.Label>
                  <ReqHelp id="form.precioEstimado" />
                  <Form.Control
                    id={`linea-${index}-precio`}
                    type="number"
                    step="any"
                    min={0}
                    isInvalid={!!lineErrors?.precioEstimado}
                    {...register(`lineas.${index}.precioEstimado`, { valueAsNumber: true })}
                  />
                  <Form.Control.Feedback type="invalid">{lineErrors?.precioEstimado?.message}</Form.Control.Feedback>
                </Col>
                <Col md={3}>
                  <Form.Label>Subtotal</Form.Label>
                  <div className="form-control-plaintext fw-semibold">
                    {formatMoney(computeMontoTotal([watched[index] ?? field]), currency)}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      })}

      {lineasError?.message && <div className="text-danger small mb-2">{lineasError.message}</div>}
      {lineasError?.root?.message && <div className="text-danger small mb-2">{lineasError.root.message}</div>}

      <div className="d-flex justify-content-between align-items-center">
        <Button
          variant="outline-primary"
          type="button"
          onClick={() => append(emptyLinea(canUseStock ? 'stock' : 'libre'))}
          disabled={fields.length >= MAX_LINEAS}
        >
          <FaPlus className="me-2" aria-hidden="true" />
          Agregar línea
        </Button>
        <div className="fs-5" data-testid="monto-total">
          Monto total estimado: <strong>{formatMoney(total, currency)}</strong>
          <ReqHelp id="form.montoTotal" placement="top" />
        </div>
      </div>
    </div>
  );
};

export default LineasEditor;
