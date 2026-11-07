// ---------------------------------------------------------------------------
// Requisiciones - epic E4: purchase order (OC), approval, sending and deliverables.
// This file must not import runtime values from requisicion.types (circular import).
// ---------------------------------------------------------------------------
import type { NivelAprobacion } from './requisicion.types';

/** Status of the purchase order inside the requisicion (the header has the matching `OC_*` estado). */
export type OrdenCompraEstado = 'Emitida' | 'En_Reaprobacion' | 'Aprobada' | 'Enviada';

export const ORDEN_COMPRA_ESTADO_LABELS: Record<OrdenCompraEstado, string> = {
  Emitida: 'Emitida',
  En_Reaprobacion: 'En reaprobación',
  Aprobada: 'Aprobada',
  Enviada: 'Enviada al proveedor',
};

export const ORDEN_COMPRA_ESTADO_VARIANT: Record<OrdenCompraEstado, string> = {
  Emitida: 'info',
  En_Reaprobacion: 'warning',
  Aprobada: 'success',
  Enviada: 'primary',
};

/** Documentary sub-state of the deliverables (it is not a requisicion estado). */
export type EntregaEstado = 'Pendiente' | 'Recibidos' | 'En_Revision' | 'Devolucion' | 'Aceptados';

export const ENTREGA_ESTADO_LABELS: Record<EntregaEstado, string> = {
  Pendiente: 'Pendiente',
  Recibidos: 'Recibidos',
  En_Revision: 'En revisión',
  Devolucion: 'Devuelto al proveedor',
  Aceptados: 'Aceptados',
};

export const ENTREGA_ESTADO_VARIANT: Record<EntregaEstado, string> = {
  Pendiente: 'secondary',
  Recibidos: 'info',
  En_Revision: 'warning',
  Devolucion: 'danger',
  Aceptados: 'success',
};

export interface OrdenCompraLinea {
  lineaId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrdenCompraPersona {
  usuarioId?: string;
  nombre?: string;
}

/** Excess of the real total over the estimate; when `requerido` the OC needs re-approval. */
export interface OrdenCompraExceso {
  requerido: boolean;
  estimado: number;
  total: number;
  margenPct: number;
}

/** Reapproval levels: same shape as the E1 approval levels, so the same eligibility rules apply. */
export interface OrdenCompraAprobacion {
  niveles?: NivelAprobacion[];
  nivelActual?: number | null;
}

export interface OrdenCompraEnvio {
  enviadaEn?: string | null;
  /** Result of the e-mail attempt; a failure does not revert the state (use "Reenviar"). */
  estadoCorreo?: string | null;
}

export interface EntregableArchivo {
  url: string;
  nombre?: string;
  tipo?: string;
  tamano?: number;
  subidoPor: 'proveedor' | 'usuario';
  fecha: string;
}

export interface OrdenCompraEntrega {
  estado: EntregaEstado;
  archivos?: EntregableArchivo[];
  ultimaObservacion?: string | null;
  ultimoRecordatorio?: string | null;
}

export interface OrdenCompra {
  numero: string;
  version: number;
  estado: OrdenCompraEstado;
  lineas: OrdenCompraLinea[];
  total: number;
  moneda?: string;
  condiciones?: string | null;
  fechaEntrega?: string | null;
  requiereEntregables: boolean;
  emitidaPor?: OrdenCompraPersona | null;
  editadaPor?: OrdenCompraPersona | null;
  emitidaEn?: string | null;
  exceso?: OrdenCompraExceso | null;
  aprobacion?: OrdenCompraAprobacion | null;
  aprobadaPor?: OrdenCompraPersona | string | null;
  aprobadaEn?: string | null;
  envio?: OrdenCompraEnvio | null;
  entrega?: OrdenCompraEntrega | null;
}

/** Body of issue / edit: the quantity of each line comes from the requisicion, never from the client. */
export interface OrdenCompraDto {
  lineas: Array<{ lineaId: string; precioUnitario: number }>;
  condiciones?: string;
  /** ISO date (YYYY-MM-DD). */
  fechaEntrega: string;
  requiereEntregables: boolean;
}

/** `version` is the version of the order the user is looking at: the server rejects a stale decision. */
export interface AprobarOrdenCompraDto {
  version: number;
}

export interface RechazarOrdenCompraDto {
  observacion: string;
  version: number;
}

/** `correoEnvio` is only accepted when the previous send had no e-mail on file (estadoCorreo `Sin_correo`). */
export interface ReenviarOrdenCompraDto {
  correoEnvio?: string;
}

export interface DevolverEntregablesDto {
  observacion: string;
}

/** Client-side hints for the deliverable files; the server validates by signature and is the authority. */
export const ENTREGABLE_MAX_BYTES = 5 * 1024 * 1024;
export const ENTREGABLE_MAX_FILES = 5;
export const ENTREGABLE_TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const ENTREGABLE_ACCEPT = '.pdf,image/jpeg,image/png,image/webp';
export const ENTREGABLE_TIPOS_MENSAJE = 'Solo se admiten PDF o imágenes (JPG, PNG, WEBP).';

/** Spanish copy for the error codes of the purchase order and deliverables endpoints. */
export const ORDEN_COMPRA_ERROR_MESSAGES: Record<string, string> = {
  SEPARACION_DE_FUNCIONES: 'No puedes aprobar una orden de compra que emitiste tú (separación de funciones).',
  OC_REQUERIDA: 'Para registrar la recepción, la orden de compra debe estar aprobada y enviada al proveedor.',
  PDF_NO_DISPONIBLE: 'El PDF de la orden de compra no está disponible en este momento. Inténtalo más tarde.',
  ENTREGABLES_NO_REQUERIDOS: 'Esta orden de compra no exige entregables.',
  OC_REQUIERE_REAPROBACION: 'Esta orden de compra requiere reaprobación: el emisor debe editarla para reiniciar los niveles.',
  ENTREGABLES_LIMIT_EXCEEDED: 'Superaste el máximo de archivos por envío (5 archivos de hasta 5 MB).',
  ORDEN_COMPRA_NOT_FOUND:'La requisición aún no tiene orden de compra.',
  FECHA_ENTREGA_INVALIDA: 'La fecha de entrega no es válida: debe ser hoy o una fecha posterior.',
  PRECIO_FALTANTE: 'Falta el precio unitario de alguna línea.',
  PRECIO_INVALIDO: 'Algún precio unitario no es válido: debe ser un número mayor o igual a 0.',
  ENTREGA_ESTADO_INVALIDO: 'Los entregables no admiten esa acción en su estado actual.',
  ENTREGA_CERRADA: 'La orden de compra ya está cerrada y no admite más entregables.',
  SOLO_EMISOR: 'Solo quien emitió la orden de compra (o quien gestiona todo) puede editarla.',
  SIN_GANADOR: 'La requisición aún no tiene un proveedor ganador.',
  ARCHIVOS_REQUERIDOS: 'Adjunta al menos un archivo.',
  CONDICIONES_LARGAS: 'Las condiciones son demasiado largas.',
  OC_CONDICIONES_MAX: 'Las condiciones son demasiado largas.',
  REQUIERE_ENTREGABLES_INVALIDO: 'Indica si se exigen entregables.',
  ENTREGA_MAX_ARCHIVOS: 'Se alcanzó el máximo de archivos para esta entrega.',
  ENTREGA_MAX_ARCHIVOS_POR_SUBIDA: 'Superaste el máximo de archivos por envío.',
  INVALID_FILE_TYPE: 'Solo se admiten PDF o imágenes (JPG, PNG, WEBP).',
  CORREO_INVALIDO: 'El correo indicado no es válido.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
};
