import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PlatformUserService } from '@/services/platformUser.service';
import type { PlatformUsersListParams, ResetPasswordResponse } from '@/types';

const getPlatformTenantId = (): string =>
  localStorage.getItem('tenantId') || '__platform__';

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export const useGetPlatformUsers = (params?: PlatformUsersListParams) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['platform-users', tenantId, params],
    () => PlatformUserService.list(params),
    { keepPreviousData: true }
  );
};

// ---------------------------------------------------------------------------
// Write hooks
// ---------------------------------------------------------------------------

export const useResetUserPassword = () => {
  const qc = useQueryClient();
  return useMutation<ResetPasswordResponse, unknown, string>(
    (userId: string) => PlatformUserService.resetPassword(userId),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-users']);
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al resetear la contraseña';
        toast.error(message);
      },
    }
  );
};
