import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { User, CreateUserDto, UpdateUserDto, UpdateProfileDto } from '@/types/user.types';

export const useUsers = (params?: any) => {
  return useQuery(['users', params], () => userService.getAll(params), { keepPreviousData: true });
};

/**
 * GET /users?permission=X — used to feed the eligible-responsables
 * multi-select in `<OtResponsablesModal>` (ots:can-be-responsible). Cached
 * for 5 minutes per design.md's "GET /users?permission=X can be slow" risk
 * note — this is an admin-only config screen, not a high-traffic list.
 */
export const useUsersEligibleFor = (permission: string) => {
  return useQuery(['users', 'eligible-for', permission], () => userService.getAll({ permission }), {
    enabled: !!permission,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUser = (id: string) => {
  return useQuery(['users', id], () => userService.getById(id), { enabled: !!id });
};

/**
 * GET /users?hasFirma=true — users of the tenant that have a signature
 * (`fileFirma`) uploaded to their profile. Feeds the "Firmante técnico"
 * selector on the sign-in-place / remote-sign flows (report-processor-and-
 * signer-traceability), where the panel user requesting the signature can be
 * different from the technician whose signature stamps the PDF.
 */
export const useUsersWithSignature = () => {
  return useQuery(['users', 'with-signature'], () => userService.getAll({ hasFirma: true }), {
    staleTime: 5 * 60 * 1000,
  });
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
