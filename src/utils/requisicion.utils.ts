import type { IconType } from 'react-icons';
import {
  FaBan,
  FaCheck,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaUserEdit,
  FaPaperPlane,
  FaPlus,
  FaRedo,
  FaTimes,
  FaTimesCircle,
  FaUndo,
  FaUserClock,
} from 'react-icons/fa';
import type { User } from '@/types/user.types';
import type {
  NivelAprobacion,
  Requisicion,
  RequisicionEstado,
  RequisicionLineaInput,
  ReglaConflictoTipo,
  ReglaWarning,
  RequisicionTimelineActor,
  UserRef,
} from '@/types/requisicion.types';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light';

export const ESTADO_VARIANT: Record<RequisicionEstado, BadgeVariant> = {
  Borrador: 'secondary',
  Enviada: 'info',
  En_Aprobacion: 'warning',
  Aprobada: 'success',
  Rechazada: 'danger',
  Cancelada: 'dark',
};

export const NIVEL_ESTADO_VARIANT: Record<string, BadgeVariant> = {
  Pendiente: 'warning',
  Aprobado: 'success',
  Rechazado: 'danger',
  Cancelado: 'secondary',
};

export interface EventMeta {
  label: string;
  icon: IconType;
  variant: BadgeVariant;
}

/** Visual identity of every timeline event (see backend REQUISICION_EVENTO). */
export const EVENT_META: Record<string, EventMeta> = {
  CREADA: { label: 'Requisición creada', icon: FaPlus, variant: 'secondary' },
  EDITADA: { label: 'Requisición editada', icon: FaEdit, variant: 'secondary' },
  ENVIADA: { label: 'Requisición enviada', icon: FaPaperPlane, variant: 'info' },
  APROBACION_SOLICITADA: { label: 'Aprobación solicitada', icon: FaUserClock, variant: 'warning' },
  NIVEL_APROBADO: { label: 'Nivel aprobado', icon: FaCheck, variant: 'success' },
  NIVEL_RECHAZADO: { label: 'Nivel rechazado', icon: FaTimes, variant: 'danger' },
  APROBADA: { label: 'Requisición aprobada', icon: FaCheckCircle, variant: 'success' },
  RECHAZADA: { label: 'Requisición rechazada', icon: FaTimesCircle, variant: 'danger' },
  RETIRADA: { label: 'Requisición retirada', icon: FaUndo, variant: 'warning' },
  REABIERTA: { label: 'Requisición reabierta', icon: FaRedo, variant: 'info' },
  CANCELADA: { label: 'Requisición cancelada', icon: FaBan, variant: 'dark' },
  APROBADORES_REASIGNADOS: { label: 'Aprobadores reasignados', icon: FaUserEdit, variant: 'info' },
  ELIMINADA: { label: 'Requisición eliminada', icon: FaTrash, variant: 'dark' },
};

export const getEventMeta = (tipo: string): EventMeta =>
  EVENT_META[tipo] ?? { label: tipo, icon: FaEdit, variant: 'secondary' };

export const formatMoney = (value?: number | null, currency = 'COP'): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
};

export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-CO');
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO');
};

/** Id of a reference that may be a bare id or a populated object. */
export const refId = (ref?: string | { _id: string } | null): string =>
  !ref ? '' : typeof ref === 'string' ? ref : ref._id;

/** Display name of a populated user reference; falls back to e-mail, then to a neutral label. */
export const DELETED_USER_LABEL = 'Usuario eliminado';

/** Soft-deleted users may come populated as `{ firstName: 'Usuario', lastName: 'eliminado' }`. */
const isDeletedUserRef = (ref: UserRef): boolean =>
  ref.firstName === 'Usuario' && ref.lastName === 'eliminado' && !ref.email;

export const userRefName = (ref?: string | UserRef | null): string => {
  // A bare id or a null (unpopulated / soft-deleted) reference has no resolvable name.
  if (!ref || typeof ref === 'string') return DELETED_USER_LABEL;
  if (isDeletedUserRef(ref)) return DELETED_USER_LABEL;
  const composed = [ref.firstName, ref.lastName].filter(Boolean).join(' ');
  return ref.fullName || composed || ref.name || ref.nombre || ref.email || DELETED_USER_LABEL;
};

/** Display name of a named catalog reference (area / tipo) that may be populated. */
export const catalogName = (ref?: string | { _id: string; nombre?: string } | null): string =>
  !ref || typeof ref === 'string' ? '—' : ref.nombre || '—';

export const actorName = (actor?: RequisicionTimelineActor | null): string => {
  if (!actor || actor.tipo === 'sistema') return 'Sistema';
  return actor.nombre || actor.nombreExterno || userRefName(actor.usuarioId);
};

/** Live total of the form lines (same formula as the server: quantity x estimated price). */
export const computeMontoTotal = (
  lineas: Array<Pick<RequisicionLineaInput, 'cantidadSolicitada' | 'precioEstimado'>>
): number => {
  const total = lineas.reduce((sum, l) => {
    const qty = Number(l.cantidadSolicitada);
    const price = Number(l.precioEstimado);
    return sum + (Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0);
  }, 0);
  return Math.round(total * 100) / 100;
};

/** The level currently waiting for a decision (by `nivelActual`, else the first pending one). */
export const getNivelActual = (req: Pick<Requisicion, 'aprobacion'>): NivelAprobacion | null => {
  const niveles = req.aprobacion?.niveles ?? [];
  const actual = req.aprobacion?.nivelActual;
  if (actual !== null && actual !== undefined) {
    const byOrden = niveles.find((n) => n.orden === actual);
    if (byOrden) return byOrden;
  }
  return niveles.find((n) => n.estado === 'Pendiente') ?? null;
};

/** Normalizes a rules-list warning (string or object) to display text. */
export const warningText = (w: ReglaWarning): string => {
  if (typeof w === 'string') return w;
  const text = w.mensaje || w.message || w.tipo || w.code || 'Advertencia en las reglas de aprobación.';
  return w.nivelOrden !== undefined && w.nivelOrden !== null ? `Nivel ${w.nivelOrden}: ${text}` : text;
};

/** Whether the user can act on someone else's requisicion regardless of ownership (`requisiciones:manage-all`). */
export const canActAsOwner = (req: Requisicion, user: User | null | undefined, hasManageAll: boolean): boolean =>
  hasManageAll || isOwner(req, user);

/**
 * Whether the approval levels stored in a Borrador belong to a previous round (retired / reopened):
 * they are history, not active levels.
 */
export const isPreviousRound = (req: Pick<Requisicion, 'estado'>): boolean => req.estado === 'Borrador';

export const isCreator = (req: Requisicion, user: User | null | undefined): boolean =>
  !!user?._id && refId(req.creadaPor) === user._id;

/** Creator or requester: the backend lets only them send, withdraw or reopen a requisicion. */
export const isOwner = (req: Requisicion, user: User | null | undefined): boolean =>
  isCreator(req, user) || (!!user?._id && refId(req.solicitanteId) === user._id);

/**
 * Whether the user could decide the current level. Mirrors the backend rules (the server is the authority):
 * eligible for the level, not creator / requester, and has not decided another level of this requisicion.
 */
export const canDecideCurrentLevel = (req: Requisicion, user: User | null | undefined): boolean => {
  if (!user?._id || req.estado !== 'En_Aprobacion') return false;
  const nivel = getNivelActual(req);
  if (!nivel || nivel.estado !== 'Pendiente') return false;
  if (refId(req.creadaPor) === user._id || refId(req.solicitanteId) === user._id) return false;
  const decidedByMe = (req.aprobacion?.niveles ?? []).some((n) => refId(n.decididoPor) === user._id);
  if (decidedByMe) return false;
  const listed = (nivel.aprobadorIds ?? []).some((a) => refId(a) === user._id);
  // `rol` levels are verified live by the server against the role; the role id is the best client-side hint.
  const byRole = nivel.aprobadorTipo === 'rol' && !!nivel.rolId && nivel.rolId === user.roleId;
  return listed || byRole;
};

/** Budget period candidates for a date: the month `YYYY-MM` and the year `YYYY`. */
export const budgetPeriods = (date: Date = new Date()): { mes: string; anio: string } => {
  const anio = String(date.getFullYear());
  return { anio, mes: `${anio}-${String(date.getMonth() + 1).padStart(2, '0')}` };
};

export interface ReglaRange {
  _id?: string;
  orden: number;
  montoDesde: number;
  montoHasta?: number | null;
}

export interface ReglaConflict {
  tipo: ReglaConflictoTipo;
  orden?: number;
}

const upper = (hasta?: number | null): number => (hasta === null || hasta === undefined ? Infinity : hasta);

/**
 * Client-side mirror of the backend consistency check (hints only; the server is the authority):
 * ORDEN_DUPLICADO, TRASLAPE (half-open ranges), ORDEN_INCONSISTENTE (larger amount => larger order), RANGO_INVALIDO.
 */
export const findReglaConflicts = (candidate: ReglaRange, others: ReglaRange[]): ReglaConflict[] => {
  const conflicts: ReglaConflict[] = [];
  const desde = candidate.montoDesde;
  const hasta = upper(candidate.montoHasta);
  if (hasta <= desde) conflicts.push({ tipo: 'RANGO_INVALIDO' });
  for (const o of others) {
    if (o._id && o._id === candidate._id) continue;
    if (o.orden === candidate.orden) conflicts.push({ tipo: 'ORDEN_DUPLICADO', orden: o.orden });
    if (desde < upper(o.montoHasta) && o.montoDesde < hasta) conflicts.push({ tipo: 'TRASLAPE', orden: o.orden });
    if ((desde < o.montoDesde && candidate.orden > o.orden) || (desde > o.montoDesde && candidate.orden < o.orden)) {
      conflicts.push({ tipo: 'ORDEN_INCONSISTENTE', orden: o.orden });
    }
  }
  return conflicts;
};
