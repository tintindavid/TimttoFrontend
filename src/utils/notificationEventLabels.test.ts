import { describe, expect, it } from 'vitest';
import { getNotificationEventLabel } from './notificationEventLabels';

describe('getNotificationEventLabel', () => {
  it('labels every requisicion.* event in Spanish and keeps the code', () => {
    expect(getNotificationEventLabel('requisicion.approved')).toBe('Requisición aprobada (requisicion.approved)');
    expect(getNotificationEventLabel('requisicion.approval.requested')).toContain('pendiente de tu aprobación');
  });

  it('falls back to the raw code for unknown events', () => {
    expect(getNotificationEventLabel('system.test')).toBe('system.test');
  });
});
