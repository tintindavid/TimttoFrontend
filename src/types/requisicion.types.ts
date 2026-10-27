import type { QueryParams } from './api.types';

// ---------------------------------------------------------------------------
// Requisiciones (premium module `usesRequisiciones`) - epic E1
// ---------------------------------------------------------------------------

export type RequisicionPrioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export type RequisicionEstado =
  | 'Borrador'
  | 'Enviada'
  | 'En_Aprobacion'
  | 'Aprobada'
  | 'Rechazada'
  | 'Cancelada';

export type RequisicionVista = 'mias' | 'por-aprobar';

export type AprobadorTipo = 'jefe_area' | 'rol' | 'usuarios';

/** Level states, mirroring the backend `NIVEL_ESTADO`. */
export type NivelAprobacionEstado = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Cancelado';

/** A reference that the backend may return as a bare id or as a populated user. */
export interface UserRef {
  _id: string;
  name?: string;
  nombre?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export const REQUISICION_PRIORIDADES: RequisicionPrioridad[] = ['Baja', 'Media', 'Alta', 'Urgente'];

export const REQUISICION_ESTADOS: RequisicionEstado[] = [
  'Borrador',
  'Enviada',
  'En_Aprobacion',
  'Aprobada',
  'Rechazada',
  'Cancelada',
];

/** Spanish labels for the states (the wire value uses underscores). */
export const REQUISICION_ESTADO_LABELS: Record<RequisicionEstado, string> = {
  Borrador: 'Borrador',
  Enviada: 'Enviada',
  En_Aprobacion: 'En aprobación',
  Aprobada: 'Aprobada',
  Rechazada: 'Rechazada',
  Cancelada: 'Cancelada',
};

export interface RequisicionLineaSnapshot {
  nombre?: string;
  tipo?: string;
  unidad?: string;
  [key: string]: unknown;
}

export interface RequisicionLinea {
  _id?: string;
  descripcion: string;
  especificaciones?: string;
  unidad: string;
  cantidadSolicitada: number;
  cantidadPendiente?: number;
  /** Linked stock item; absent for a free-text line. */
  inventarioItemId?: string | null;
  precioEstimado: number;
  moneda?: string;
  estadoLinea?: string;
  snapshot?: RequisicionLineaSnapshot | null;
}

/** Line payload accepted when creating / editing a requisicion. */
export interface RequisicionLineaInput {
  _id?: string;
  descripcion: string;
  especificaciones?: string;
  unidad: string;
  cantidadSolicitada: number;
  inventarioItemId?: string | null;
  precioEstimado: number;
}

export interface NivelAprobacion {
  orden: number;
  nombre?: string;
  reglaId?: string;
  /** Frozen snapshot of the rule at submission time. */
  aprobadorTipo: AprobadorTipo;
  rolId?: string | null;
  usuariosIds?: Array<string | UserRef>;
  montoDesde?: number;
  montoHasta?: number | null;
  /** Users resolved as eligible when the level was frozen. */
  aprobadorIds: Array<string | UserRef>;
  estado: NivelAprobacionEstado;
  decididoPor?: string | UserRef | null;
  fecha?: string | null;
  observacion?: string | null;
}

export interface RequisicionAprobacion {
  nivelActual: number | null;
  niveles: NivelAprobacion[];
}

export interface RequisicionTimelineActor {
  tipo: 'usuario' | 'sistema' | string;
  usuarioId?: string | UserRef | null;
  nombreExterno?: string | null;
  /** Resolved display name when the backend provides it. */
  nombre?: string | null;
}

export interface RequisicionTimelineEvent {
  eventId?: string;
  /** Event code, see REQUISICION_EVENTO. */
  tipo: string;
  fecha: string;
  actor: RequisicionTimelineActor;
  estadoAnterior?: RequisicionEstado | null;
  estadoNuevo?: RequisicionEstado | null;
  observacion?: string | null;
  datos?: Record<string, unknown> | null;
}

export interface Requisicion {
  _id: string;
  tenantId?: string;
  consecutivo: string;
  titulo: string;
  tipoRequisicionId: string | TipoRequisicion;
  areaId: string | Area;
  prioridad: RequisicionPrioridad;
  fechaRequerida?: string | null;
  justificacion?: string;
  estado: RequisicionEstado;
  creadaPor: string | UserRef;
  solicitanteId?: string | UserRef;
  enviadaAt?: string | null;
  aprobadaAt?: string | null;
  rechazadaAt?: string | null;
  canceladaAt?: string | null;
  canceladaMotivo?: string;
  lineas: RequisicionLinea[];
  montoEstimado: number;
  moneda?: string;
  aprobacion?: RequisicionAprobacion;
  timeline?: RequisicionTimelineEvent[];
  createdAt?: string;
  updatedAt?: string;
  /** Optimistic-concurrency token: approve / reject must send the version of the requisicion that was shown. */
  version: number;
}

export interface CreateRequisicionDto {
  titulo: string;
  tipoRequisicionId: string;
  areaId: string;
  prioridad: RequisicionPrioridad;
  fechaRequerida?: string | null;
  justificacion?: string;
  lineas: RequisicionLineaInput[];
}

/** `tipoRequisicionId` is immutable once created, so it is not editable. */
export type UpdateRequisicionDto = Partial<Omit<CreateRequisicionDto, 'tipoRequisicionId'>>;

/** Sort keys accepted by GET /requisiciones (anything else is a 400). */
export const REQUISICION_SORT_FIELDS = ['createdAt', 'consecutivo', 'montoEstimado', 'estado', 'titulo'] as const;
export type RequisicionSortField = (typeof REQUISICION_SORT_FIELDS)[number];

/** Exact query-param set accepted by GET /requisiciones (the backend rejects unknown keys). */
export const REQUISICION_QUERY_KEYS = [
  'page',
  'limit',
  'estado',
  'areaId',
  'tipoRequisicionId',
  'creadaPor',
  'fechaDesde',
  'fechaHasta',
  'search',
  'vista',
  'sortBy',
  'order',
] as const;

export interface RequisicionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: RequisicionSortField;
  order?: 'asc' | 'desc';
  estado?: RequisicionEstado;
  areaId?: string;
  tipoRequisicionId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  creadaPor?: string;
  vista?: RequisicionVista;
}

export interface CancelarRequisicionDto {
  motivo: string;
}

/** Retire / reopen: moves the requisicion back to Borrador. */
export interface CambiarEstadoRequisicionDto {
  estado: 'Borrador';
  observacion: string;
}

export interface AprobarRequisicionDto {
  version: number;
  observacion?: string;
}

export interface RechazarRequisicionDto {
  version: number;
  observacion: string;
}

export interface ReasignarAprobadoresDto {
  nivelOrden: number;
  aprobadorIds: string[];
}

// ---------------------------------------------------------------------------
// Organizational configuration
// ---------------------------------------------------------------------------

/** Maximum number of heads an area can have (backend `AREA_MAX_JEFES`). */
export const AREA_MAX_JEFES = 10;

export interface Area {
  _id: string;
  tenantId?: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  jefesIds: Array<string | UserRef>;
  activa: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAreaDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  jefesIds?: string[];
  activa?: boolean;
}

/** `codigo` is immutable. */
export type UpdateAreaDto = Partial<Omit<CreateAreaDto, 'codigo'>>;

export interface AreaQueryParams extends QueryParams {
  activa?: boolean;
}

export interface TipoRequisicion {
  _id: string;
  tenantId?: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTipoRequisicionDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo?: boolean;
}

/** `codigo` is immutable. */
export type UpdateTipoRequisicionDto = Partial<Omit<CreateTipoRequisicionDto, 'codigo'>>;

export interface TipoRequisicionQueryParams extends QueryParams {
  activo?: boolean;
}

/**
 * Approval rule = ONE approval LEVEL by amount (one document per level). A rule applies to a requisicion when
 * `montoDesde <= montoEstimado` (cumulative); `montoHasta` (null = no limit) is only used to validate overlaps.
 */
export interface ReglaAprobacion {
  _id: string;
  tenantId?: string;
  orden: number;
  nombre: string;
  montoDesde: number;
  montoHasta: number | null;
  aprobadorTipo: AprobadorTipo;
  rolId?: string | null;
  usuariosIds?: Array<string | UserRef>;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReglaAprobacionDto {
  orden: number;
  nombre: string;
  montoDesde: number;
  montoHasta?: number | null;
  aprobadorTipo: AprobadorTipo;
  /** Only for `rol`. */
  rolId?: string;
  /** Only for `usuarios`. */
  usuariosIds?: string[];
  activo?: boolean;
}

/** A non-blocking warning returned alongside the rules list (plain text or `{ mensaje | message }`). */
export type ReglaWarning =
  | string
  | { tipo?: string; mensaje?: string; nivelOrden?: number; message?: string; code?: string };

export type UpdateReglaAprobacionDto = Partial<Omit<CreateReglaAprobacionDto, 'rolId'>> & {
  rolId?: string | null;
};

export interface ReglaAprobacionQueryParams extends QueryParams {
  activo?: boolean;
}

/** Conflict kinds reported in `details` of a 400 REGLAS_INCONSISTENTES. */
export type ReglaConflictoTipo = 'ORDEN_DUPLICADO' | 'TRASLAPE' | 'ORDEN_INCONSISTENTE' | 'RANGO_INVALIDO';

export interface PresupuestoArea {
  _id: string;
  tenantId?: string;
  areaId: string | Area;
  /** `YYYY` (year) or `YYYY-MM` (month). */
  periodo: string;
  monto: number;
  moneda?: string;
  /** Alert threshold in percent (1-100). */
  umbralAlerta?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePresupuestoAreaDto {
  areaId: string;
  periodo: string;
  monto: number;
  umbralAlerta?: number;
}

/** Area and period are the identity of the budget: only amount and threshold change. */
export type UpdatePresupuestoAreaDto = Partial<Pick<CreatePresupuestoAreaDto, 'monto' | 'umbralAlerta'>>;

export interface PresupuestoAreaQueryParams extends QueryParams {
  areaId?: string;
  periodo?: string;
}

/**
 * Response of GET /presupuestos-area/resumen. Without a configured budget `configurado` is false and
 * `monto`, `disponible` and `porcentaje` are null (consumido / comprometido are still returned).
 */
export interface PresupuestoResumen {
  areaId?: string;
  periodo?: string;
  moneda?: string;
  configurado: boolean;
  monto: number | null;
  consumido: number;
  comprometido: number;
  disponible: number | null;
  porcentaje: number | null;
  umbralAlerta?: number;
  alerta: boolean;
  sobrepasado: boolean;
}

export interface PresupuestoResumenParams {
  areaId: string;
  periodo: string;
}

/** Spanish copy for the backend error codes the requisiciones endpoints can answer. */
export const REQUISICION_ERROR_MESSAGES: Record<string, string> = {
  TRANSICION_INVALIDA: 'La requisición no admite esa acción en su estado actual.',
  ESTADO_NO_EDITABLE: 'La requisición solo puede editarse en estado Borrador.',
  SEPARACION_FUNCIONES: 'No puedes aprobar tu propia requisición ni más de un nivel de la misma.',
  CONFLICTO_CONCURRENTE: 'Otra persona modificó la requisición al mismo tiempo. Recarga e intenta de nuevo.',
  SOLO_CREADOR: 'Solo el creador o el solicitante puede realizar esta acción.',
  NIVEL_NO_PENDIENTE: 'Solo se pueden reasignar los aprobadores de niveles pendientes.',
  APROBACION_BLOQUEARIA_NIVEL:
    'Aprobar ahora dejaría un nivel posterior sin aprobador disponible. Pide a un administrador que reasigne los aprobadores.',
  APROBADOR_INVALIDO: 'Alguno de los aprobadores seleccionados no es válido para este nivel.',
  ROL_SIN_PERMISO_APROBAR: 'El rol seleccionado no tiene permiso para aprobar requisiciones.',
  APROBADOR_SIN_PERMISO: 'Alguno de los usuarios seleccionados no tiene permiso para aprobar requisiciones.',
  OBSERVACION_REQUERIDA: 'Debes indicar una observación.',
  APROBADOR_NO_ELEGIBLE: 'No eres aprobador del nivel que está pendiente.',
  SIN_REGLAS_APROBACION: 'No hay reglas de aprobación configuradas para esta requisición.',
  NIVEL_SIN_APROBADOR_ELEGIBLE: 'Un nivel de aprobación no tiene ningún aprobador elegible.',
  TIPO_EN_USO: 'El tipo está en uso; solo puede desactivarse.',
  AREA_EN_USO: 'El área está en uso; solo puede desactivarse.',
  DUPLICATE_AREA: 'Ya existe un área con ese nombre.',
  DUPLICATE_AREA_CODE: 'Ya existe un área con ese código.',
  REGLAS_INCONSISTENTES: 'Los niveles de la regla se traslapan o su orden no es consistente.',
  JEFE_INVALIDO: 'Alguno de los jefes seleccionados no pertenece a la organización.',
  AREA_INVALIDA: 'El área seleccionada no existe o está inactiva.',
  TIPO_INVALIDO: 'El tipo seleccionado no existe o está inactivo.',
  TIPO_INMUTABLE: 'El tipo de una requisición no puede cambiarse.',
  LINEA_DUPLICADA: 'Hay dos líneas con el mismo ítem de stock.',
  VERSION_DESACTUALIZADA: 'La requisición cambió mientras la revisabas. Recarga para ver la versión actual.',
  CAPABILITY_DISABLED: 'El módulo de Requisiciones no está activo para esta organización.',
};

/** Spanish labels for the conflicts listed by REGLAS_INCONSISTENTES. */
export const REGLA_CONFLICTO_LABELS: Record<ReglaConflictoTipo, string> = {
  ORDEN_DUPLICADO: 'Ya existe otro nivel con el mismo orden.',
  TRASLAPE: 'El rango de montos se traslapa con otro nivel activo.',
  ORDEN_INCONSISTENTE: 'El orden no es consistente con el monto: un monto mayor debe tener un orden mayor.',
  RANGO_INVALIDO: 'El rango de montos no es válido (el límite superior debe ser mayor que el inferior).',
};
