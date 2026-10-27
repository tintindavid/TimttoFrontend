/** Spanish labels for the notification events; unknown events fall back to the raw code. */
export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  'requisicion.submitted': 'Requisición enviada',
  'requisicion.approval.requested': 'Requisición pendiente de tu aprobación',
  'requisicion.level.approved': 'Nivel de requisición aprobado',
  'requisicion.approved': 'Requisición aprobada',
  'requisicion.rejected': 'Requisición rechazada',
  'requisicion.withdrawn': 'Requisición retirada',
  'requisicion.cancelled': 'Requisición cancelada',
};

export const getNotificationEventLabel = (event: string): string => {
  const label = NOTIFICATION_EVENT_LABELS[event];
  return label ? `${label} (${event})` : event;
};
