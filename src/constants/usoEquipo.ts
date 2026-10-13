// Values are persisted as-is; the first five are legacy and must stay valid for saved HVs.
export const USO_EQUIPO_OPTIONS = [
  { value: 'Apoyo', label: 'Apoyo' },
  { value: 'Soporte', label: 'Soporte' },
  { value: 'Produccion', label: 'Producción' },
  { value: 'Investigacion', label: 'Investigación' },
  { value: 'Docencia', label: 'Docencia' },
  { value: 'Diagnóstico', label: 'Diagnóstico' },
  { value: 'Monitoreo y soporte vital', label: 'Monitoreo y soporte vital' },
  { value: 'Terapéutico y rehabilitación', label: 'Terapéutico y rehabilitación' },
  { value: 'Laboratorio clínico', label: 'Laboratorio clínico' },
  { value: 'Anestesia y quirófano', label: 'Anestesia y quirófano' },
  { value: 'Imágenes diagnósticas', label: 'Imágenes diagnósticas' },
] as const;

export type UsoEquipo = (typeof USO_EQUIPO_OPTIONS)[number]['value'];

export const isMonths = (value: unknown): value is string =>
  typeof value === 'string' && /^\d+$/.test(value.trim());

export const formatMonths = (value?: string): string => {
  if (!value) return '';
  if (!isMonths(value)) return value;
  const n = value.trim();
  return `${n} ${n === '1' ? 'mes' : 'meses'}`;
};
