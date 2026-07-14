import * as XLSX from 'xlsx';
import { Reporte } from '@/types/reporte.types';
import { OT } from '@/types/ot.types';

/**
 * Formats a date-like value (ISO string, Date, or null/undefined) to a locale
 * date string. Returns '' so blank cells don't clutter the spreadsheet.
 */
function formatDate(value: unknown): string {
  if (!value) return '';
  try {
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-CO');
  } catch {
    return String(value);
  }
}

function joinActividades(reporte: Reporte): string {
  const list = reporte.actividadesRealizadas || [];
  if (list.length === 0) return '';
  return list
    .map((actividad) => {
      const marker = actividad.realizado ? '✔' : '✖';
      const label = actividad.descripcion || actividad.nombre || '—';
      const obs = actividad.observaciones ? ` (${actividad.observaciones})` : '';
      return `${marker} ${label}${obs}`;
    })
    .join(' | ');
}

function responsableName(reporte: Reporte): string {
  const responsable = reporte.ResponsableMtto;
  if (!responsable) return '';
  return `${responsable.firstName || ''} ${responsable.lastName || ''}`.trim();
}

/**
 * Build a plain-object row for the "Reportes" sheet. Field names are the
 * column headers, so keep them human-readable — they show up unchanged in the
 * Excel header row.
 */
function reportRow(reporte: Reporte) {
  const equipo = reporte.equipoSnapshot || ({} as Reporte['equipoSnapshot']);
  return {
    'N° Reporte': reporte.consecutivo || '',
    'Estado': reporte.estado,
    'Procesado': reporte.procesado ? 'Sí' : 'No',
    'Estado Operativo': reporte.estadoOperativo || '',
    'Tipo Mantenimiento': String(reporte.tipoMtto || ''),
    'Item': equipo.ItemText || '',
    'Marca': equipo.Marca || '',
    'Modelo': equipo.Modelo || '',
    'Serie': equipo.Serie || '',
    'Inventario': equipo.Inventario || '',
    'INVIMA': equipo.Invima || reporte.Equipo?.Invima || '',
    'Clase Riesgo': equipo.Riesgo || reporte.Equipo?.Riesgo || '',
    'Sede': equipo.Sede || '',
    'Servicio': equipo.Servicio || '',
    'Ubicación': equipo.Ubicacion || '',
    'Fecha Procesado': formatDate(reporte.fechaProcesado),
    'Fecha Mantenimiento': formatDate(reporte.fechaMtto),
    'Fecha Finalizado': formatDate(reporte.fechaFinalizado || reporte.fechaFinalizdo),
    'Duración (min)': reporte.duracion ?? '',
    'Responsable': responsableName(reporte),
    'Falla Reportada': reporte.fallaReportada || '',
    'Diagnóstico': reporte.diagnostico || '',
    'Acción Tomada': reporte.accionTomada || '',
    'Causa Encontrada': reporte.causaEncontrada || '',
    'Motivo Fuera de Servicio': reporte.motivoFueraServicio || '',
    'Observación General': reporte.observacion || '',
    'Observación Estado Final': reporte.observacionEstadoFinal || '',
    'Actividades Realizadas': joinActividades(reporte),
    'Actividades Completadas': reporte.resumen?.actividadesCompletadas ?? '',
    'Total Actividades': reporte.resumen?.totalActividades ?? '',
    '% Completado': reporte.resumen?.porcentajeCompletado ?? '',
    'Cantidad Repuestos': reporte.resumen?.cantidadRepuestos ?? (reporte.repuestos?.length ?? 0),
    'Motivo Cancelación': reporte.motivoCancelacion || '',
    'Fecha Cancelación': formatDate(reporte.fechaCancelacion),
    'Hoja de Trabajo': reporte.hojaDeTrabajo || '',
  };
}

/** Build a flat row per repuesto, keyed by its parent report's consecutivo. */
function repuestoRows(reportes: Reporte[]) {
  const rows: Record<string, string | number>[] = [];
  reportes.forEach((reporte) => {
    (reporte.repuestos || []).forEach((repuesto) => {
      rows.push({
        'N° Reporte': reporte.consecutivo || '',
        'Equipo': reporte.equipoSnapshot?.ItemText || '',
        'Marca / Modelo': `${reporte.equipoSnapshot?.Marca || ''} ${reporte.equipoSnapshot?.Modelo || ''}`.trim(),
        'Serie': reporte.equipoSnapshot?.Serie || '',
        'Repuesto': repuesto.nombre || '',
        'Cantidad': repuesto.cantidad ?? 0,
        'Estado': repuesto.estado || '',
        'Costo Unitario': repuesto.costo ?? '',
        'Motivo': repuesto.motivo || '',
        'Fecha Solicitud': formatDate(repuesto.fechaSolicitud),
        'Fecha Instalación': formatDate(repuesto.fechaInstalacion),
      });
    });
  });
  return rows;
}

/**
 * Fit every column to the widest cell in the sheet (approximate; Excel width
 * units are ~1 character wide). Prevents "###" and huge horizontal scroll.
 */
function autoFitColumns<T extends Record<string, unknown>>(rows: T[]): XLSX.ColInfo[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    const headerLen = key.length;
    const maxCellLen = rows.reduce((max, row) => {
      const cell = row[key];
      const text = cell == null ? '' : String(cell);
      return Math.max(max, text.length);
    }, 0);
    return { wch: Math.min(60, Math.max(10, Math.max(headerLen, maxCellLen) + 2)) };
  });
}

/**
 * Export the entire OT to an XLSX file with two sheets:
 *   - Reportes: full data for each report attached to the OT.
 *   - Repuestos: every spare part requested across all reports, joined by
 *     the parent report's consecutivo.
 *
 * When the OT has no reports at all, still produces a file with the empty
 * sheets so the user gets feedback that the export ran.
 */
export function exportOtToXlsx(ot: OT, reportes: Reporte[]): void {
  const workbook = XLSX.utils.book_new();

  const reportesRows = reportes.map(reportRow);
  const reportSheet = XLSX.utils.json_to_sheet(reportesRows);
  reportSheet['!cols'] = autoFitColumns(reportesRows);
  XLSX.utils.book_append_sheet(workbook, reportSheet, 'Reportes');

  const partsRows = repuestoRows(reportes);
  const partsSheet = XLSX.utils.json_to_sheet(partsRows);
  partsSheet['!cols'] = autoFitColumns(partsRows);
  XLSX.utils.book_append_sheet(workbook, partsSheet, 'Repuestos');

  const consecutivo = (ot as { Consecutivo?: string }).Consecutivo || 'ot';
  const filename = `OT-${consecutivo}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
