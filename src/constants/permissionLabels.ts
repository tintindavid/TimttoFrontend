/**
 * Human-readable labels (Spanish) for permission strings.
 *
 * The permission identifiers themselves (e.g. `ots:read`) live in
 * `src/constants/permissions.ts` and are the source of truth for the backend
 * `authorize()` middleware. This file is UI-only: it maps those IDs to strings
 * shown to end users. Never persist or transmit these labels.
 *
 * Adding a new permission?
 *   1. Add the ID to `constants/permissions.ts` (mirror of backend catalog).
 *   2. If the resource is new, add it to RESOURCE_LABELS.
 *   3. If the action verb is new (something beyond CRUD), add it to ACTION_LABELS.
 *   Otherwise `formatPermission()` falls back to the resource/action slug.
 */

interface ResourceLabel {
  /** Plural noun for the resource group ("Órdenes de Trabajo"). */
  plural: string;
  /** Singular form used in short badges ("orden"). Use lowercase. */
  singular: string;
}

export const RESOURCE_LABELS: Record<string, ResourceLabel> = {
  users: { plural: 'Usuarios', singular: 'usuario' },
  roles: { plural: 'Roles', singular: 'rol' },
  'my-tenant': { plural: 'Mi Organización', singular: 'organización' },
  customers: { plural: 'Clientes', singular: 'cliente' },
  sedes: { plural: 'Sedes', singular: 'sede' },
  addresses: { plural: 'Direcciones', singular: 'dirección' },
  servicios: { plural: 'Servicios', singular: 'servicio' },
  'equipo-items': { plural: 'Equipos', singular: 'equipo' },
  'estado-equipo': { plural: 'Estados de equipo', singular: 'estado de equipo' },
  'hv-equipos': { plural: 'Hojas de Vida de Equipos', singular: 'hoja de vida' },
  items: { plural: 'Items', singular: 'item' },
  ots: { plural: 'Órdenes de Trabajo', singular: 'orden de trabajo' },
  reports: { plural: 'Reportes', singular: 'reporte' },
  informes: { plural: 'Informes', singular: 'informe' },
  'pdf-reports': { plural: 'PDF de Reportes', singular: 'PDF de reporte' },
  cronogramas: { plural: 'Cronogramas', singular: 'cronograma' },
  'actividad-mtto': { plural: 'Actividades de Mantenimiento', singular: 'actividad de mantenimiento' },
  'actividad-reporte': { plural: 'Actividades en Reportes', singular: 'actividad en reporte' },
  'protocolo-mtto': { plural: 'Protocolos de Mantenimiento', singular: 'protocolo de mantenimiento' },
  'protocolo-actividad': { plural: 'Protocolos de Actividad', singular: 'protocolo de actividad' },
  repuestos: { plural: 'Repuestos', singular: 'repuesto' },
  inventario: { plural: 'Inventario', singular: 'ítem de inventario' },
  'repuesto-trazabilidad': { plural: 'Trazabilidad de Repuestos', singular: 'registro de trazabilidad' },
  sheetwork: { plural: 'Sheetwork', singular: 'sheetwork' },
  tickets: { plural: 'Tickets', singular: 'ticket' },
  'service-qrs': { plural: 'Códigos QR de Servicio', singular: 'QR de servicio' },
};

export const ACTION_LABELS: Record<string, string> = {
  read: 'Ver',
  create: 'Crear',
  update: 'Editar',
  delete: 'Eliminar',
  pdf: 'Exportar PDF',
  generate: 'Generar',
  close: 'Cerrar',
  reopen: 'Reabrir',
  reply: 'Responder',
  'assign-role': 'Asignar rol',
};

/**
 * Split a permission ID into its parts. Falls back to the raw slug if the
 * catalog does not know the resource or action — so a missing translation
 * degrades to something readable instead of blank.
 */
export function formatPermission(permission: string) {
  const [resourceKey = 'general', actionKey = 'read'] = permission.split(':');
  const resource = RESOURCE_LABELS[resourceKey];
  const action = ACTION_LABELS[actionKey];

  const resourcePlural = resource?.plural ?? resourceKey;
  const resourceSingular = resource?.singular ?? resourceKey;
  const actionLabel = action ?? actionKey;

  return {
    /** "Órdenes de Trabajo" — for group headers. */
    resourcePlural,
    /** "orden de trabajo" — lowercase, singular, for badge suffixes. */
    resourceSingular,
    /** "Ver" — action verb only, useful when the group already names the resource. */
    action: actionLabel,
    /** "Ver orden de trabajo" — verb + singular resource, for un-grouped badges. */
    short: `${actionLabel} ${resourceSingular}`,
    /** "Ver órdenes de trabajo" — verb + plural resource. */
    full: `${actionLabel} ${resourcePlural.toLowerCase()}`,
    /** The raw ID, useful for tooltips / debugging. */
    id: permission,
  };
}
