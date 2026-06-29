/**
 * Ticket area module types.
 * Aligned with backend contract in
 * `openspec/changes/add-ticket-area-module/specs/tickets/spec.md` and design.md.
 */

export type TicketStatus = 'pendiente' | 'en_proceso' | 'cerrado' | 'cancelado';

export type TicketUrgency = 'normal' | 'urgente' | 'critico';

export type TicketSource = 'qr' | 'admin';

export type ClosingReason =
  | 'ot_closed'
  | 'report_cancelled'
  | 'equipment_deleted'
  | 'manual';

export type OtPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface TicketRequester {
  name: string;
  position: string;
}

export interface TicketInternalNote {
  note: string;
  addedBy: string;
  addedAt: string;
}

export interface TicketEquipmentSnapshot {
  equipoId: string;
  itemNombre?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  inventario?: string;
  ubicacion?: string;
}

export interface TicketClienteRef {
  _id: string;
  Razonsocial?: string;
  nombre?: string;
}

export interface TicketSedeRef {
  _id: string;
  nombreSede?: string;
}

export interface TicketServicioRef {
  _id: string;
  nombre?: string;
}

export interface TicketUserRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export interface Ticket {
  _id: string;
  tenantId: string;
  consecutivo: string;
  batchId: string;
  source: TicketSource;
  qrId?: string | null;

  ClienteId: string | TicketClienteRef;
  sedeId: string | TicketSedeRef;
  servicioId: string | TicketServicioRef;
  equipoId: string;
  equipoSnapshot?: TicketEquipmentSnapshot;

  requestedBy: TicketRequester;
  observation?: string;
  generalObservation?: string;
  urgency: TicketUrgency;

  status: TicketStatus;
  assignedTo?: string | TicketUserRef | null;
  assignedAt?: string | null;
  firstResponseAt?: string | null;
  responseTimeMinutes?: number | null;

  workOrderId?: {
    _id: string;
      consecutivo: string;
      OtPrioridad?: OtPriority;
      EstadoOt?: string;
  }
  workOrderCreatedAt?: string | null;
  reportId?:{
    _id: string;
    consecutivo: string;
    estado: string;
  }

  closedAt?: string | null;
  closedBy?: string | TicketUserRef | null;
  closingReason?: ClosingReason | null;
  closingObservation?: string | null;
  resolutionTimeMinutes?: number | null;

  internalNotes?: TicketInternalNote[];
  internalNotesCount?: number;

  createdBy?: string | TicketUserRef | null;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public-facing ticket DTO. Server strips `internalNotes`, `assignedTo`,
 * `closedBy`, `createdBy`, `qrId` per design.md §D15.
 */
export interface PublicTicket {
  _id: string;
  consecutivo: string;
  batchId: string;
  status: TicketStatus;
  urgency: TicketUrgency;
  equipoSnapshot?: TicketEquipmentSnapshot;
  requestedBy: TicketRequester;
  observation?: string;
  generalObservation?: string;
  closingReason?: ClosingReason | null;
  closingObservation?: string | null;
  responseTimeMinutes?: number | null;
  resolutionTimeMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketBatchSummary {
  batchId: string;
  ClienteId: string | TicketClienteRef;
  sedeId: string | TicketSedeRef;
  servicioId: string | TicketServicioRef;
  count: number;
  createdAt: string;
  tickets: Ticket[];
}

export interface TicketStats {
  total: number;
  pendiente: number;
  en_proceso: number;
  cerrado: number;
  cancelado: number;
}

/* ---------- Request / DTO shapes ---------- */

export interface CreateTicketEquipoPayload {
  equipoId: string;
  observation?: string;
}

export interface CreateTicketBatchDto {
  ClienteId: string;
  sedeId: string;
  servicioId: string;
  equipos: CreateTicketEquipoPayload[];
  generalObservation?: string;
  urgency: TicketUrgency;
}

export interface CreateTicketBatchPublicDto {
  equipos: CreateTicketEquipoPayload[];
  generalObservation?: string;
  urgency: TicketUrgency;
  requestedBy: TicketRequester;
}

export interface CreateTicketBatchResponse {
  batchId: string;
  tickets: Array<{ id: string; consecutivo: string }>;
  created: number;
}

export interface AssignTicketDto {
  responsableId: string;
}

export interface AddTicketNoteDto {
  note: string;
}

export interface CancelTicketDto {
  closingObservation?: string;
}

export interface CreateOTFromTicketsDto {
  ticketIds: string[];
  responsableId: string;
}

export interface CreateOTFromTicketsResponse {
  otId: string;
  consecutivoOT?: string;
  tickets: Array<{ id: string; reportId: string }>;
}

export interface TicketListFilters {
  status?: TicketStatus;
  ClienteId?: string;
  servicioId?: string;
  sedeId?: string;
  urgency?: TicketUrgency;
  assignedTo?: string;
  batchId?: string;
  source?: TicketSource;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}
