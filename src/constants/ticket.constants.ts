/**
 * Spanish UI labels and helpers for the ticket area module.
 * Status / urgency keys stay in English (matches backend enum); labels are Spanish.
 */

import {
  ClosingReason,
  OtPriority,
  TicketStatus,
  TicketUrgency,
} from '@/types/ticket.types';

export const TICKET_STATUS_VALUES: TicketStatus[] = [
  'pendiente',
  'en_proceso',
  'cerrado',
  'cancelado',
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export const TICKET_STATUS_TAB_LABELS: Record<TicketStatus, string> = {
  pendiente: 'Pendientes',
  en_proceso: 'En Proceso',
  cerrado: 'Cerrados',
  cancelado: 'Cancelados',
};

/** Bootstrap variant per status (used by Badge bg / text). */
export const TICKET_STATUS_VARIANTS: Record<TicketStatus, string> = {
  pendiente: 'warning',
  en_proceso: 'primary',
  cerrado: 'success',
  cancelado: 'danger',
};

export const TICKET_URGENCY_VALUES: TicketUrgency[] = [
  'normal',
  'urgente',
  'critico',
];

export const TICKET_URGENCY_LABELS: Record<TicketUrgency, string> = {
  normal: 'Normal',
  urgente: 'Urgente',
  critico: 'Crítico',
};

export const TICKET_URGENCY_VARIANTS: Record<TicketUrgency, string> = {
  normal: 'secondary',
  urgente: 'warning',
  critico: 'danger',
};

/** Backend stores urgency ranks; client mirrors them for max-aggregation. */
export const TICKET_URGENCY_RANK: Record<TicketUrgency, number> = {
  normal: 1,
  urgente: 2,
  critico: 3,
};

/** D18: urgency → OT priority. Max of mapped values across selected tickets. */
export const URGENCY_TO_OT_PRIORITY: Record<TicketUrgency, OtPriority> = {
  normal: 'Media',
  urgente: 'Alta',
  critico: 'Urgente',
};

export const OT_PRIORITY_VARIANTS: Record<OtPriority, string> = {
  Baja: 'secondary',
  Media: 'info',
  Alta: 'warning',
  Urgente: 'danger',
};

export const TICKET_SOURCE_LABELS = {
  qr: 'QR',
  admin: 'Panel',
} as const;

export const TICKET_SOURCE_VARIANTS = {
  qr: 'info',
  admin: 'secondary',
} as const;

export const CLOSING_REASON_LABELS: Record<ClosingReason, string> = {
  ot_closed: 'OT cerrada',
  report_cancelled: 'Reporte cancelado',
  equipment_deleted: 'Equipo eliminado',
  manual: 'Cancelación manual',
};

/** Public form validation per spec. */
export const PUBLIC_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,80}$/;
export const PUBLIC_POSITION_MIN = 2;
export const PUBLIC_POSITION_MAX = 60;

/** Password policy mirrored from `serviceQr.dto.js` (length 8–32, upper, lower, digit). */
export const QR_PASSWORD_MIN = 8;
export const QR_PASSWORD_MAX = 32;
export const QR_PASSWORD_RULES = {
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasDigit: /[0-9]/,
};

/**
 * Compute the maximum mapped OT priority for a set of tickets.
 * Defaults to 'Media' when the array is empty.
 */
export const computeMaxOtPriority = (
  urgencies: TicketUrgency[]
): OtPriority => {
  if (!urgencies.length) return 'Media';
  const max = urgencies.reduce<TicketUrgency>((acc, u) => {
    return TICKET_URGENCY_RANK[u] > TICKET_URGENCY_RANK[acc] ? u : acc;
  }, 'normal');
  return URGENCY_TO_OT_PRIORITY[max];
};

/** D17: display batchId compactly. */
export const formatBatchId = (batchId: string): string => {
  if (!batchId) return '';
  const head = batchId.slice(0, 8);
  return `BTC-${head}`;
};

/** sessionStorage key for the public sessionToken (D8). */
export const PUBLIC_SESSION_STORAGE_KEY = 'timtto.public.sessionToken';
export const PUBLIC_SESSION_QR_TOKEN_KEY = 'timtto.public.qrToken';
