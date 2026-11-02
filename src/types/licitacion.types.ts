// ---------------------------------------------------------------------------
// Requisiciones - epic E3: licitacion (RFQ), cotizaciones, ganador y compra directa.
// This file must not import runtime values from requisicion.types (circular import).
// ---------------------------------------------------------------------------

export type EstadoEnvioProveedor = 'Pendiente' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Ganador' | 'Descartado';

export const ESTADO_ENVIO_LABELS: Record<EstadoEnvioProveedor, string> = {
  Pendiente: 'Pendiente de envío',
  Enviado: 'Invitación enviada',
  Aceptado: 'Aceptó participar',
  Rechazado: 'Rechazó participar',
  Ganador: 'Ganador',
  Descartado: 'Descartado',
};

export const ESTADO_ENVIO_VARIANT: Record<EstadoEnvioProveedor, string> = {
  Pendiente: 'secondary',
  Enviado: 'info',
  Aceptado: 'primary',
  Rechazado: 'danger',
  Ganador: 'success',
  Descartado: 'dark',
};

export interface CotizacionArchivo {
  url: string;
  nombre?: string;
  tipo?: string;
  tamano?: number;
}

/** Previous version of a quotation, kept when the supplier (or a buyer) sends a new one. */
export interface CotizacionVersion {
  fechaRespuesta?: string | null;
  archivo?: CotizacionArchivo | null;
  linkPropuesta?: string | null;
  observacion?: string | null;
  valorTotal?: number | null;
  moneda?: string | null;
  origen?: 'portal' | 'interno';
}

export interface CotizacionProveedor {
  versiones?: CotizacionVersion[];
  archivo?: CotizacionArchivo | null;
  linkPropuesta?: string | null;
  observacion?: string | null;
  valorTotal?: number | null;
  moneda?: string | null;
  tiempoEntregaDias?: number | null;
  fechaRespuesta?: string | null;
  origen?: 'portal' | 'interno';
}

export interface ProveedorLicitacion {
  _id: string;
  proveedorId: string;
  nombre: string;
  /** Null for users without purchasing permissions. */
  correoEnvio?: string | null;
  /** True when a quotation exists; the only quotation signal for users who cannot see the detail. */
  tieneCotizacion?: boolean;
  /** Last 4 characters of the portal token, for support only; the token itself is never returned. */
  tokenHint?: string;
  estadoEnvio: EstadoEnvioProveedor;
  fechaEnvio?: string | null;
  cotizacion?: CotizacionProveedor | null;
  vistasCount?: number;
}

export interface CompraDirectaInfo {
  proveedorId?: string;
  justificacion?: string;
  at?: string;
}

export interface Licitacion {
  instrucciones?: string | null;
  fechaLimiteCotizacion?: string | null;
  ganadorId?: string | null;
  compraDirecta?: CompraDirectaInfo | boolean | null;
  proveedores: ProveedorLicitacion[];
}

export interface EnvioFallido {
  paId: string;
  motivo?: string;
}

export interface EnviosResultado {
  enviados: string[];
  fallidos: EnvioFallido[];
}

export interface AsignarProveedorDto {
  proveedorId: string;
  correoEnvio?: string;
}

export interface AbrirLicitacionDto {
  /** ISO date-time. */
  fechaLimiteCotizacion: string;
  /** Optional text shown to every supplier in the portal (max 500). */
  instrucciones?: string;
}

export interface AmpliarFechaDto {
  /** ISO date-time. */
  fechaLimiteCotizacion: string;
}

export const INSTRUCCIONES_MAX = 500;

export interface ReenviarInvitacionDto {
  correoEnvio?: string;
}

export interface RegistrarCotizacionDto {
  archivo?: File | null;
  linkPropuesta?: string;
  observacion?: string;
  valorTotal?: number;
  moneda?: string;
  tiempoEntregaDias?: number;
}

export interface CompraDirectaDto {
  proveedorId: string;
  justificacion: string;
}

export interface ComparativoProveedor {
  paId: string;
  nombre: string;
  estadoEnvio: EstadoEnvioProveedor;
  fechaRespuesta?: string | null;
  archivo?: CotizacionArchivo | null;
  linkPropuesta?: string | null;
  observacion?: string | null;
  valorTotal?: number | null;
  moneda?: string | null;
  tiempoEntregaDias?: number | null;
  masEconomica?: boolean;
}

export interface Comparativo {
  proveedores: ComparativoProveedor[];
  hayComparables: boolean;
}

export const LICITACION_MAX_PROVEEDORES = 25;
export const COMPRA_DIRECTA_MIN_JUSTIFICACION = 20;
export const COTIZACION_MAX_BYTES = 5 * 1024 * 1024;
export const COTIZACION_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Spanish copy for the error codes of the licitacion endpoints and the supplier portal. */
export const LICITACION_ERROR_MESSAGES: Record<string, string> = {
  PROVEEDOR_DUPLICADO: 'Ese proveedor ya está asignado a la requisición.',
  PROVEEDOR_INVALIDO: 'El proveedor seleccionado no es válido o no pertenece a tu organización.',
  PROVEEDORES_INSUFICIENTES:
    'Para abrir la licitación necesitas al menos dos proveedores activos con un correo válido.',
  COTIZACION_VACIA: 'La cotización debe incluir al menos un archivo, un enlace o una observación.',
  SIN_COTIZACIONES: 'Aún no hay ninguna cotización recibida.',
  GANADOR_YA_SELECCIONADO: 'Ya se seleccionó un ganador para esta requisición.',
  PROVEEDOR_SIN_COTIZACION: 'El proveedor seleccionado no tiene una cotización registrada.',
  LICITACION_ABIERTA:
    'La requisición tiene una licitación en curso: cierra las cotizaciones y selecciona un ganador antes de registrar recepciones.',
  FECHA_LIMITE_INVALIDA: 'La fecha límite debe ser futura y no superar los 90 días.',
  JUSTIFICACION_CORTA: 'La justificación debe tener al menos 20 caracteres.',
  FECHA_LIMITE_VENCIDA: 'La fecha límite para cotizar ya venció.',
  TOKEN_EXPIRADO: 'Este enlace ya no está disponible.',
  NOTIFICACIONES_DESACTIVADAS: 'El envío de correos está desactivado en este entorno; no se pueden enviar invitaciones.',
  PUBLIC_APP_URL_NO_CONFIGURADA: 'La URL pública de la aplicación no está configurada; contacta a soporte.',
  PROVEEDOR_CON_COTIZACION: 'El proveedor ya tiene una cotización registrada y no se puede quitar.',
  LIMITE_PROVEEDORES: 'Se alcanzó el máximo de 25 proveedores por requisición.',
  PROVEEDOR_INACTIVO: 'El proveedor está inactivo en el catálogo.',
  PROVEEDOR_NO_ENCONTRADO: 'No se encontró el proveedor en esta requisición.',
  LICITACION_CERRADA: 'La licitación ya no recibe cotizaciones.',
  INVITACION_NO_RESPONDIBLE: 'Esta invitación ya no admite una respuesta.',
  LINK_INVALIDO: 'El enlace debe ser una dirección https:// válida.',
  CORREO_INVALIDO: 'El correo indicado no es válido.',
  VALOR_INVALIDO: 'El valor total indicado no es válido.',
  MONEDA_INVALIDA: 'La moneda indicada no es válida.',
  TIEMPO_ENTREGA_INVALIDO: 'El tiempo de entrega indicado no es válido.',
  ENVIO_FALLIDO: 'No se pudo enviar el correo. Verifica la dirección e inténtalo de nuevo.',
  FILE_CONTENT_MISMATCH: 'El contenido del archivo no corresponde a su tipo. Adjunta un PDF o imagen válidos.',
  FILE_TOO_LARGE: 'El archivo supera los 5 MB.',
  INVALID_FILE_TYPE: 'Solo se admiten PDF o imágenes (JPG, PNG, WEBP).',
};
