import type { BadgeVariant } from '@/utils/requisicion.utils';
import type { Repuesto, RepuestoDisponibilidad, RepuestoRequisicionResumen } from '@/types/repuesto.types';

export const DISPONIBILIDAD_LABELS: Record<RepuestoDisponibilidad, string> = {
  En_Requisicion: 'En requisición',
  En_Aprobacion: 'En aprobación',
  En_Compra: 'En compra',
  En_Camino: 'En camino',
  En_Abastecimiento: 'En abastecimiento',
  Recibida: 'Recibida (por confirmar)',
  Disponible: 'Disponible',
  En_Disputa: 'En disputa',
  Cancelada: 'Cancelada',
};

export const DISPONIBILIDAD_VARIANT: Record<RepuestoDisponibilidad, BadgeVariant> = {
  En_Requisicion: 'secondary',
  En_Aprobacion: 'warning',
  En_Compra: 'info',
  En_Camino: 'info',
  En_Abastecimiento: 'primary',
  Recibida: 'info',
  Disponible: 'success',
  En_Disputa: 'danger',
  Cancelada: 'dark',
};

/** Options of the "requisición" filter of the requested-parts list. */
export const REQUISICION_FILTRO_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas (requisición)' },
  { value: 'sin', label: 'Sin requisición' },
  { value: 'con', label: 'Con requisición' },
  ...(Object.keys(DISPONIBILIDAD_LABELS) as RepuestoDisponibilidad[]).map((value) => ({
    value,
    label: DISPONIBILIDAD_LABELS[value],
  })),
];

type WithRequisicion = Pick<Repuesto, 'EstadoSolicitud'> & { requisicion?: RepuestoRequisicionResumen | null };

/** Requisition link of a spare-part request, when the API returned one (module on). */
export const getRequisicionLink = (r?: Partial<WithRequisicion> | null): RepuestoRequisicionResumen | null =>
  r?.requisicion?.requisicionId ? r.requisicion : null;

export const isLinkedToRequisicion = (r?: Partial<WithRequisicion> | null): boolean => !!getRequisicionLink(r);

export const isDisponible = (r?: Partial<WithRequisicion> | null): boolean =>
  getRequisicionLink(r)?.disponibilidad === 'Disponible';

/** Eligible to start a requisition: still `Solicitado` and not linked to one. */
export const canHacerRequisicion = (r?: Partial<WithRequisicion> | null): boolean =>
  (r?.EstadoSolicitud || 'Solicitado') === 'Solicitado' && !isLinkedToRequisicion(r);

/** Linked to a requisition that has not made the part available yet (backend blocks install / edit / delete). */
export const isBlockedByRequisicion = (r?: Partial<WithRequisicion> | null): boolean =>
  isLinkedToRequisicion(r) && !isDisponible(r) && r?.requisicion?.disponibilidad !== 'Cancelada';
