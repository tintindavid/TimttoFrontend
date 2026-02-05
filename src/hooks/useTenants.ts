import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantService } from '@/services/tenant.service';
import { CreateTenantDto, UpdateTenantDto } from '@/types/tenant.types';

export const useTenants = (params?: any) => {
  return useQuery({ queryKey: ['tenants', params], queryFn: () => tenantService.getAll(params) });
};

export const useTenant = (id?: string) => {
  return useQuery({ queryKey: ['tenant', id], queryFn: () => tenantService.getById(id as string), enabled: !!id });
};

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantDto) => tenantService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTenantDto | FormData }) => tenantService.update(id, payload as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useDeleteTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export default useTenants;
