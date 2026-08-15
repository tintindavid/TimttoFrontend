import type { UserRole } from './user.types';

/** Phase 1 only implements `inapp` at runtime; `email` is declared for phase 2 (Resend). */
export type NotificationChannel = 'inapp' | 'email';

/**
 * Event name is a free-form string on the wire (backend enum lives in
 * `TimttoApp/src/config/notificationEvents.js`, fetched via `GET /notifications/events`).
 * Phase 1 has a single value: `system.test`.
 */
export type NotificationEvent = string;

export interface Notification {
  _id: string;
  tenantId: string;
  userId: string;
  event: NotificationEvent;
  title: string;
  body: string;
  // reason: payload shape is event-specific and only ever carries IDs/links (see design D-payload-convention); consumers narrow it per-field.
  data?: Record<string, any> | null;
  channels: NotificationChannel[];
  readAt: string | null;
  createdAt: string;
}

export interface NotificationRuleRecipients {
  roles: UserRole[];
  userIds: string[];
}

export interface NotificationRule {
  _id: string;
  tenantId: string;
  event: NotificationEvent;
  recipients: NotificationRuleRecipients;
  channels: NotificationChannel[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationRuleDto {
  event: NotificationEvent;
  recipients: NotificationRuleRecipients;
  channels: NotificationChannel[];
  enabled: boolean;
}

export type UpdateNotificationRuleDto = Partial<CreateNotificationRuleDto>;

export interface NotificationPreference {
  _id?: string;
  tenantId: string;
  userId: string;
  event: NotificationEvent;
  mutedChannels: NotificationChannel[];
}

export interface UpsertNotificationPreferenceDto {
  event: NotificationEvent;
  mutedChannels: NotificationChannel[];
}

export interface UnreadCountResponse {
  count: number;
}

/** Local UI state — one toast entry rendered by NotificationToastContainer. */
export interface NotificationToastItem {
  id: string;
  title: string;
  body: string;
}
