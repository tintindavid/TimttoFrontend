import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/role.service';
import { ApiResponse } from '@/types/api.types';
import { CreateRoleDto, PermissionsCatalog, Role, UpdateRoleDto } from '@/types/role.types';

type RolesQueryParams = {
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
};

export const useRoles = (params?: RolesQueryParams) => {
  return useQuery<ApiResponse<Role[]>>({
    queryKey: ['roles', params],
    queryFn: () => roleService.getAll(params),
    keepPreviousData: true,
  });
};

export const useRole = (id: string) => {
  return useQuery<ApiResponse<Role>>({
    queryKey: ['roles', id],
    queryFn: () => roleService.getById(id),
    enabled: !!id,
  });
};

export const usePermissions = () => {
  return useQuery<ApiResponse<PermissionsCatalog>>({
    queryKey: ['permissions'],
    queryFn: () => roleService.getPermissions(),
    staleTime: Infinity,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Role>, Error, CreateRoleDto>({
    mutationFn: (data) => roleService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Role>, Error, { id: string; data: UpdateRoleDto }>({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => roleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
};