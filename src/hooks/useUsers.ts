import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { User, CreateUserDto, UpdateUserDto, UpdateProfileDto } from '@/types/user.types';

export const useUsers = (params?: any) => {
  return useQuery(['users', params], () => userService.getAll(params), { keepPreviousData: true });
};

export const useUser = (id: string) => {
  return useQuery(['users', id], () => userService.getById(id), { enabled: !!id });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation((data: CreateUserDto) => userService.create(data), {
    onSuccess: () => qc.invalidateQueries(['users']),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: UpdateUserDto }) => userService.update(id, data), {
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['users']);
      qc.invalidateQueries(['users', vars.id]);
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: UpdateProfileDto }) => userService.updateProfile(id, data),
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries(['users']);
        qc.invalidateQueries(['users', vars.id]);
      },
    }
  );
};

export const useUpdateSignature = () => {
  const qc = useQueryClient();
  return useMutation(
    ({ id, signatureData }: { id: string; signatureData: string }) => userService.updateSignature(id, signatureData),
    {
      onSuccess: (_, vars) => {
        qc.invalidateQueries(['users']);
        qc.invalidateQueries(['users', vars.id]);
      },
    }
  );
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation((id: string) => userService.delete(id), {
    onSuccess: () => qc.invalidateQueries(['users']),
  });
};
