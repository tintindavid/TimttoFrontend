import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

const getTenantId = () => sessionStorage.getItem('viewAsTenantId') || localStorage.getItem('tenantId') || '';

export const useNotifications = (params?: { page?: number; limit?: number; unread?: boolean }) => {
  const tenantId = getTenantId();
  return useQuery(
    ['notifications', tenantId, params],
    () => notificationService.list(params),
    { enabled: !!tenantId, keepPreviousData: true }
  );
};

export const useUnreadCount = () => {
  const tenantId = getTenantId();
  return useQuery(
    ['notifications', 'unread-count', tenantId],
    () => notificationService.unreadCount(),
    // The socket invalidates this on every push; refetchOnWindowFocus is a
    // fallback for tabs that missed a push while backgrounded/reconnecting.
    { enabled: !!tenantId, refetchOnWindowFocus: true }
  );
};

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation((id: string) => notificationService.markAsRead(id), {
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
    },
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation(() => notificationService.markAllAsRead(), {
    onSuccess: () => {
      qc.invalidateQueries(['notifications']);
    },
  });
};

export default useNotifications;
