import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { PlatformTenantService } from '@/services/platformTenant.service';
import type {
  PlatformTenantsListParams,
  CreateTenantWithAdminInput,
  UpdateTenantMetadataInput,
  SuspendTenantInput,
} from '@/types';

/**
 * SuperAdmin queries don't filter by tenantId (cross-tenant scope).
 * We still include tenantId in the cache key so that RQ invalidation is
 * correctly scoped if the SuperAdmin context ever changes (E2).
 */
const getPlatformTenantId = (): string =>
  localStorage.getItem('tenantId') || '__platform__';

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export const useGetPlatformTenants = (params?: PlatformTenantsListParams) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['platform-tenants', tenantId, params],
    () => PlatformTenantService.list(params),
    { keepPreviousData: true }
  );
};

export const useGetPlatformTenant = (id: string | undefined) => {
  const tenantId = getPlatformTenantId();
  return useQuery(
    ['platform-tenants', tenantId, 'detail', id],
    () => PlatformTenantService.getById(id!),
    { enabled: !!id }
  );
};

// ---------------------------------------------------------------------------
// Write hooks
// ---------------------------------------------------------------------------

export const useCreateTenantWithAdmin = () => {
  const qc = useQueryClient();
  return useMutation(
    (input: CreateTenantWithAdminInput) => PlatformTenantService.createWithAdmin(input),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-tenants']);
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al crear el tenant';
        toast.error(message);
      },
    }
  );
};

export const useUpdateTenantMetadata = () => {
  const qc = useQueryClient();
  return useMutation(
    ({
      id,
      input,
      logoFile,
    }: {
      id: string;
      input: UpdateTenantMetadataInput;
      logoFile?: File;
    }) => PlatformTenantService.updateMetadata(id, input, logoFile),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-tenants']);
        toast.success('Tenant actualizado correctamente');
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al actualizar el tenant';
        toast.error(message);
      },
    }
  );
};

export const useSuspendTenant = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ id, input }: { id: string; input: SuspendTenantInput }) =>
      PlatformTenantService.suspend(id, input),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-tenants']);
        toast.success('Tenant suspendido');
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al suspender el tenant';
        toast.error(message);
      },
    }
  );
};

export const useReactivateTenant = () => {
  const qc = useQueryClient();
  return useMutation(
    (id: string) => PlatformTenantService.reactivate(id),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-tenants']);
        toast.success('Tenant reactivado');
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al reactivar el tenant';
        toast.error(message);
      },
    }
  );
};

export const useSoftDeleteTenant = () => {
  const qc = useQueryClient();
  return useMutation(
    (id: string) => PlatformTenantService.softDelete(id),
    {
      onSuccess: () => {
        qc.invalidateQueries(['platform-tenants']);
        toast.success('Tenant eliminado');
      },
      onError: (err: unknown) => {
        // reason: axios error shape not exposed by tanstack-query generics
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Error al eliminar el tenant';
        toast.error(message);
      },
    }
  );
};
