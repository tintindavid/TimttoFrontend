import { BaseService } from './base.service';
import {
  NotificationRule,
  CreateNotificationRuleDto,
  UpdateNotificationRuleDto,
} from '@/types/notification.types';

class NotificationRuleService extends BaseService<
  NotificationRule,
  CreateNotificationRuleDto,
  UpdateNotificationRuleDto
> {
  constructor() {
    super('/notification-rules');
  }
}

export const notificationRuleService = new NotificationRuleService();
export default notificationRuleService;
