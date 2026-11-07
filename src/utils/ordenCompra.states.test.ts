import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@/constants/permissions';
import { formatPermission } from '@/constants/permissionLabels';
import {
  ORDEN_COMPRA_ERROR_MESSAGES,
  ORDEN_COMPRA_ESTADO_LABELS,
  ENTREGA_ESTADO_LABELS,
} from '@/types/ordenCompra.types';
import { REQUISICION_ERROR_MESSAGES, REQUISICION_ESTADOS, REQUISICION_ESTADO_LABELS } from '@/types/requisicion.types';
import {
  EVENT_META,
  ESTADO_VARIANT,
  OC_ESTADOS,
  RECEIVABLE_ESTADOS,
  RECEPTION_PANEL_ESTADOS,
  formatDateUtc,
} from '@/utils/requisicion.utils';
import { getRequisicionErrorMessage } from '@/utils/requisicionErrors';

describe('purchase-order states', () => {
  it('registers the four OC estados with label and color, and lists them in the enumeration', () => {
    OC_ESTADOS.forEach((estado) => {
      expect(REQUISICION_ESTADOS).toContain(estado);
      expect(REQUISICION_ESTADO_LABELS[estado]).toBeTruthy();
      expect(ESTADO_VARIANT[estado]).toBeTruthy();
      expect(RECEPTION_PANEL_ESTADOS).toContain(estado);
    });
    expect(OC_ESTADOS).toEqual(['OC_Emitida', 'OC_En_Reaprobacion', 'OC_Aprobada', 'OC_Enviada']);
  });

  it('every estado has a label and a color', () => {
    REQUISICION_ESTADOS.forEach((estado) => {
      expect(REQUISICION_ESTADO_LABELS[estado], estado).toBeTruthy();
      expect(ESTADO_VARIANT[estado], estado).toBeTruthy();
    });
  });

  it('enables reception only in Aprobada (no purchase), OC_Enviada and En_Recepcion', () => {
    expect([...RECEIVABLE_ESTADOS].sort()).toEqual(['Aprobada', 'En_Recepcion', 'OC_Enviada']);
    ['Adjudicada', 'OC_Emitida', 'OC_En_Reaprobacion', 'OC_Aprobada'].forEach((estado) =>
      expect(RECEIVABLE_ESTADOS).not.toContain(estado)
    );
  });

  it('labels the purchase-order and deliverable sub-states in Spanish', () => {
    expect(Object.keys(ORDEN_COMPRA_ESTADO_LABELS)).toEqual(['Emitida', 'En_Reaprobacion', 'Aprobada', 'Enviada']);
    expect(Object.keys(ENTREGA_ESTADO_LABELS)).toEqual(['Pendiente', 'Recibidos', 'En_Revision', 'Devolucion', 'Aceptados']);
  });

  it('gives every new timeline event a visual identity', () => {
    [
      'OC_EMITIDA',
      'OC_EDITADA',
      'OC_REAPROBACION_REQUERIDA',
      'OC_APROBADA',
      'OC_RECHAZADA',
      'OC_ENVIADA',
      'OC_REENVIADA',
      'ENTREGABLES_RECIBIDOS',
      'PASO_REVISION_ENTREGA',
      'DEVUELTA',
      'ENTREGABLES_ACEPTADOS',
      'RECORDATORIO_ENVIADO',
    ].forEach((tipo) => expect(EVENT_META[tipo], tipo).toBeDefined());
  });
});

describe('purchase-order permissions', () => {
  it('mirrors the three new permissions and labels them in Spanish', () => {
    expect(PERMISSIONS.REQUISICIONES_ISSUE_PO).toBe('requisiciones:issue-po');
    expect(PERMISSIONS.REQUISICIONES_APPROVE_PO).toBe('requisiciones:approve-po');
    expect(PERMISSIONS.REQUISICIONES_MANAGE_DELIVERABLES).toBe('requisiciones:manage-deliverables');
    expect(formatPermission(PERMISSIONS.REQUISICIONES_ISSUE_PO).action).toBe('Emitir orden de compra');
    expect(formatPermission(PERMISSIONS.REQUISICIONES_APPROVE_PO).action).toBe('Aprobar orden de compra');
    expect(formatPermission(PERMISSIONS.REQUISICIONES_MANAGE_DELIVERABLES).action).toBe('Gestionar entregables');
  });
});

describe('purchase-order error codes', () => {
  it.each([
    'SEPARACION_DE_FUNCIONES',
    'OC_REQUERIDA',
    'PDF_NO_DISPONIBLE',
    'ENTREGABLES_NO_REQUERIDOS',
    'SIN_REGLAS_APROBACION',
    'NOTIFICACIONES_DESACTIVADAS',
    'PUBLIC_APP_URL_NO_CONFIGURADA',
    'TRANSICION_INVALIDA',
    'CONFLICTO_CONCURRENTE',
    'VERSION_DESACTUALIZADA',
    'FECHA_ENTREGA_INVALIDA',
    'PRECIO_FALTANTE',
    'PRECIO_INVALIDO',
    'ENTREGA_ESTADO_INVALIDO',
    'ENTREGA_CERRADA',
    'SOLO_EMISOR',
    'SIN_GANADOR',
    'INVALID_FILE_TYPE',
    'CORREO_INVALIDO',
    'ARCHIVOS_REQUERIDOS',
  ])('maps %s to Spanish copy', (code) => {
    expect(REQUISICION_ERROR_MESSAGES[code], code).toBeTruthy();
    expect(getRequisicionErrorMessage({ response: { data: { error: { code } } } })).toBe(REQUISICION_ERROR_MESSAGES[code]);
  });

  it('keeps the purchase-order codes in their own catalog', () => {
    expect(Object.keys(ORDEN_COMPRA_ERROR_MESSAGES)).toEqual(expect.arrayContaining(['SEPARACION_DE_FUNCIONES', 'OC_REQUERIDA']));
  });
});

describe('formatDateUtc', () => {
  it('does not shift a date-only value with the time zone', () => {
    expect(formatDateUtc('2026-12-15T00:00:00.000Z')).toBe(new Date('2026-12-15T12:00:00.000Z').toLocaleDateString('es-CO', { timeZone: 'UTC' }));
    expect(formatDateUtc(undefined)).toBe('—');
    expect(formatDateUtc('nope')).toBe('—');
  });
});
