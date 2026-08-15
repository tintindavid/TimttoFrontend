import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationRuleService } from '@/services/notificationRule.service';
import { notificationService } from '@/services/notification.service';
import { CreateNotificationRuleDto, UpdateNotificationRuleDto } from '@/types/notification.types';

const getTenantId = () => sessionStorage.getItem('viewAsTenantId') || localStorage.getItem('tenantId') || '';

// Rule catalog is bounded by NOTIFICATION_EVENTS (currently a single phase-1
// event, growing one-by-one per business event added). No pagination UI needed
// yet; params kept for forward-compat with the paginated envelope the backend
// already returns.
export const useNotificationRules = (params?: { page?: number; limit?: number }) => {
  const tenantId = getTenantId();
  return useQuery(
    ['notification-rules', tenantId, params],
    () => notificationRuleService.getAll(params),
    { enabled: !!tenantId, keepPreviousData: true }
  );
};

export const useCreateNotificationRule = () => {
  const qc = useQueryClient();
  return useMutation((data: CreateNotificationRuleDto) => notificationRuleService.create(data), {
    onSuccess: () => qc.invalidateQueries(['notification-rules']),
  });
};

export const useUpdateNotificationRule = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: UpdateNotificationRuleDto }) => notificationRuleService.update(id, data),
    { onSuccess: () => qc.invalidateQueries(['notification-rules']) }
  );
};

export const useDeleteNotificationRule = () => {
  const qc = useQueryClient();
  return useMutation((id: string) => notificationRuleService.delete(id), {
    onSuccess: () => qc.invalidateQueries(['notification-rules']),
  });
};

export const useNotificationEvents = () => {
  return useQuery(['notification-events'], () => notificationService.getEvents());
};

export const useSendTestNotification = () => {
  const qc = useQueryClient();
  return useMutation(() => notificationService.sendTest(), {
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });
};

export default useNotificationRules;
