import type { TipoActividad, EstadoFinal } from '@/types/actividadExterna.types';

export const TIPOS_ACTIVIDAD: { value: TipoActividad; label: string }[] = [
  { value: 'calibracion',          label: 'Calibración' },
  { value: 'verificacion',         label: 'Verificación' },
  { value: 'ajuste',               label: 'Ajuste' },
  { value: 'calificacion',         label: 'Calificación' },
  { value: 'modernizacion',        label: 'Modernización' },
  { value: 'reacondicionamiento',  label: 'Reacondicionamiento' },
  { value: 'actualizacion_sw_fw',  label: 'Actualización de SW/FW' },
  { value: 'inspeccion_tecnica',   label: 'Inspección técnica' },
  { value: 'auditoria_seguridad',  label: 'Auditoría de seguridad' },
  { value: 'otro',                 label: 'Otro' },
];

export const ESTADOS_FINAL_LABELS: Record<EstadoFinal, string> = {
  aprobada: 'Aprobada',
  aprobada_con_observaciones: 'Aprobada con observaciones',
  rechazada: 'Rechazada',
  pendiente: 'Pendiente',
  otro: 'Otro',
};

export const ERROR_CODE_MESSAGES: Record<string, string> = {
  CHAIN_NOT_VIGENTE: 'La cadena ya no está vigente.',
  CHAIN_UNIQUE_NO_SUCCESSION: 'La cadena es única y no admite sucesora.',
  TYPE_MISMATCH: 'El tipo de actividad no coincide con la cadena.',
  TIPO_CUSTOM_REQUIRED: 'Debes especificar el tipo cuando seleccionas "Otro".',
  ESTADO_FINAL_CUSTOM_REQUIRED: 'Debes especificar el estado final cuando seleccionas "Otro".',
  FECHA_IN_FUTURE: 'La fecha no puede ser futura.',
  CANNOT_DELETE_HISTORICAL: 'Solo se puede borrar la actividad vigente de su cadena.',
  FILE_TOO_LARGE: 'El archivo excede 10 MB.',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido.',
  FILE_CONTENT_MISMATCH: 'El contenido del archivo no coincide con su extensión.',
  VALIDATION_ERROR: 'Datos inválidos. Revisa el formulario.',
  SUCCESSOR_CANNOT_BE_UNIQUE: 'Una actividad sucesora no puede ser única.',
  INCONSISTENT_STATE: 'La cadena está en un estado inconsistente. Contacta a soporte.',
  FRECUENCIA_REQUIRED: 'Debes indicar la frecuencia en meses o marcar la actividad como única.',
  NO_EVIDENCE: 'La actividad no tiene evidencia adjunta.',
  NOT_FOUND: 'No se encontró el recurso solicitado.',
};
