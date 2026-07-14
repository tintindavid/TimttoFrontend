/**
 * Mirror of the backend permission catalog (src/constants/permissions.js).
 *
 * Keep in sync manually — the values MUST match the backend strings exactly.
 * If the two diverge, RBAC checks fail silently: the UI thinks the user is
 * allowed while the API returns 403 (or vice versa).
 *
 * The frontend uses these constants for compile-time safety when writing
 * `<Can permission={PERMISSIONS.OTS_CREATE}>` — never build the strings
 * inline in components.
 */
export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ASSIGN_ROLE: 'users:assign-role',

  ROLES_READ: 'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',

  MY_TENANT_READ: 'my-tenant:read',
  MY_TENANT_UPDATE: 'my-tenant:update',

  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  SEDES_READ: 'sedes:read',
  SEDES_CREATE: 'sedes:create',
  SEDES_UPDATE: 'sedes:update',
  SEDES_DELETE: 'sedes:delete',

  ADDRESSES_READ: 'addresses:read',
  ADDRESSES_CREATE: 'addresses:create',
  ADDRESSES_UPDATE: 'addresses:update',
  ADDRESSES_DELETE: 'addresses:delete',

  SERVICIOS_READ: 'servicios:read',
  SERVICIOS_CREATE: 'servicios:create',
  SERVICIOS_UPDATE: 'servicios:update',
  SERVICIOS_DELETE: 'servicios:delete',

  EQUIPO_ITEMS_READ: 'equipo-items:read',
  EQUIPO_ITEMS_CREATE: 'equipo-items:create',
  EQUIPO_ITEMS_UPDATE: 'equipo-items:update',
  EQUIPO_ITEMS_DELETE: 'equipo-items:delete',

  ESTADO_EQUIPO_READ: 'estado-equipo:read',
  ESTADO_EQUIPO_CREATE: 'estado-equipo:create',
  ESTADO_EQUIPO_UPDATE: 'estado-equipo:update',
  ESTADO_EQUIPO_DELETE: 'estado-equipo:delete',

  HV_EQUIPOS_READ: 'hv-equipos:read',
  HV_EQUIPOS_CREATE: 'hv-equipos:create',
  HV_EQUIPOS_UPDATE: 'hv-equipos:update',
  HV_EQUIPOS_DELETE: 'hv-equipos:delete',
  HV_EQUIPOS_PDF: 'hv-equipos:pdf',

  ITEMS_READ: 'items:read',
  ITEMS_CREATE: 'items:create',
  ITEMS_UPDATE: 'items:update',
  ITEMS_DELETE: 'items:delete',

  OTS_READ: 'ots:read',
  OTS_CREATE: 'ots:create',
  OTS_UPDATE: 'ots:update',
  OTS_DELETE: 'ots:delete',
  OTS_CLOSE: 'ots:close',
  OTS_REOPEN: 'ots:reopen',

  REPORTS_READ: 'reports:read',
  REPORTS_CREATE: 'reports:create',
  REPORTS_UPDATE: 'reports:update',
  REPORTS_DELETE: 'reports:delete',
  REPORTS_PDF: 'reports:pdf',

  INFORMES_READ: 'informes:read',
  INFORMES_CREATE: 'informes:create',
  INFORMES_UPDATE: 'informes:update',
  INFORMES_DELETE: 'informes:delete',
  INFORMES_GENERATE: 'informes:generate',

  PDF_REPORTS_GENERATE: 'pdf-reports:generate',

  CRONOGRAMAS_READ: 'cronogramas:read',
  CRONOGRAMAS_CREATE: 'cronogramas:create',
  CRONOGRAMAS_UPDATE: 'cronogramas:update',
  CRONOGRAMAS_DELETE: 'cronogramas:delete',
  CRONOGRAMAS_PDF: 'cronogramas:pdf',

  ACTIVIDAD_MTTO_READ: 'actividad-mtto:read',
  ACTIVIDAD_MTTO_CREATE: 'actividad-mtto:create',
  ACTIVIDAD_MTTO_UPDATE: 'actividad-mtto:update',
  ACTIVIDAD_MTTO_DELETE: 'actividad-mtto:delete',

  ACTIVIDAD_REPORTE_READ: 'actividad-reporte:read',
  ACTIVIDAD_REPORTE_CREATE: 'actividad-reporte:create',
  ACTIVIDAD_REPORTE_UPDATE: 'actividad-reporte:update',
  ACTIVIDAD_REPORTE_DELETE: 'actividad-reporte:delete',

  PROTOCOLO_MTTO_READ: 'protocolo-mtto:read',
  PROTOCOLO_MTTO_CREATE: 'protocolo-mtto:create',
  PROTOCOLO_MTTO_UPDATE: 'protocolo-mtto:update',
  PROTOCOLO_MTTO_DELETE: 'protocolo-mtto:delete',

  PROTOCOLO_ACTIVIDAD_READ: 'protocolo-actividad:read',
  PROTOCOLO_ACTIVIDAD_CREATE: 'protocolo-actividad:create',
  PROTOCOLO_ACTIVIDAD_UPDATE: 'protocolo-actividad:update',
  PROTOCOLO_ACTIVIDAD_DELETE: 'protocolo-actividad:delete',

  REPUESTOS_READ: 'repuestos:read',
  REPUESTOS_CREATE: 'repuestos:create',
  REPUESTOS_UPDATE: 'repuestos:update',
  REPUESTOS_DELETE: 'repuestos:delete',

  INVENTARIO_READ: 'inventario:read',
  INVENTARIO_CREATE: 'inventario:create',
  INVENTARIO_UPDATE: 'inventario:update',
  INVENTARIO_DELETE: 'inventario:delete',

  REPUESTO_TRAZABILIDAD_READ: 'repuesto-trazabilidad:read',
  REPUESTO_TRAZABILIDAD_CREATE: 'repuesto-trazabilidad:create',
  REPUESTO_TRAZABILIDAD_UPDATE: 'repuesto-trazabilidad:update',
  REPUESTO_TRAZABILIDAD_DELETE: 'repuesto-trazabilidad:delete',

  SHEETWORK_READ: 'sheetwork:read',
  SHEETWORK_CREATE: 'sheetwork:create',
  SHEETWORK_UPDATE: 'sheetwork:update',
  SHEETWORK_DELETE: 'sheetwork:delete',

  TICKETS_READ: 'tickets:read',
  TICKETS_CREATE: 'tickets:create',
  TICKETS_UPDATE: 'tickets:update',
  TICKETS_DELETE: 'tickets:delete',
  TICKETS_CLOSE: 'tickets:close',
  TICKETS_REPLY: 'tickets:reply',

  SERVICE_QRS_READ: 'service-qrs:read',
  SERVICE_QRS_CREATE: 'service-qrs:create',
  SERVICE_QRS_UPDATE: 'service-qrs:update',
  SERVICE_QRS_DELETE: 'service-qrs:delete',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
