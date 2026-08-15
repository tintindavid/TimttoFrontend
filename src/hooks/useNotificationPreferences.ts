import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationPreferenceService } from '@/services/notificationPreference.service';
import { UpsertNotificationPreferenceDto } from '@/types/notification.types';

const getTenantId = () => sessionStorage.getItem('viewAsTenantId') || localStorage.getItem('tenantId') || '';

export const useNotificationPreferences = () => {
  const tenantId = getTenantId();
  return useQuery(
    ['notification-preferences', tenantId],
    () => notificationPreferenceService.list(),
    { enabled: !!tenantId }
  );
};

export const useUpsertNotificationPreference = () => {
  const qc = useQueryClient();
  return useMutation(
    (data: UpsertNotificationPreferenceDto) => notificationPreferenceService.upsert(data),
    { onSuccess: () => qc.invalidateQueries(['notification-preferences']) }
  );
};

export default useNotificationPreferences;
