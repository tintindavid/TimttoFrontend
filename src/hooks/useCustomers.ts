import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, Customer, CustomerListParams } from '@/types/customer.types';
import { ApiResponse } from '@/types/api.types';
import { toast } from 'react-toastify';

/** Message shown when the backend rejects a customer write with 403 CAPABILITY_DISABLED (Gestiona clientes is off). */
export const CUSTOMERS_CAPABILITY_DISABLED_MESSAGE =
  'Tu organización no tiene habilitada la gestión de clientes. Solicita su activación al administrador de la plataforma.';

const notifyCapabilityDisabled = (error: unknown): void => {
  const response = (error as { response?: { status?: number; data?: { error?: { code?: string } } } })?.response;
  if (response?.status === 403 && response.data?.error?.code === 'CAPABILITY_DISABLED') {
    toast.error(CUSTOMERS_CAPABILITY_DISABLED_MESSAGE);
  }
};

/**
 * Lists third parties. Without `kind` the backend returns clients only, so every
 * existing consumer keeps its behaviour. Pass `{ kind: 'provider' }` for providers.
 */
export const useCustomers = (params?: CustomerListParams, options?: { enabled?: boolean }) => {
  return useQuery<ApiResponse<Customer[]>, Error>({ 
    queryKey: ['customers', params], 
    queryFn: () => customerService.getAll(params),
    enabled: options?.enabled ?? true,
  });
};

export const useCustomer = (id: string, options?: Partial<UseQueryOptions<ApiResponse<Customer>, Error>>) => {
  return useQuery<ApiResponse<Customer>, Error>({ 
    queryKey: ['customers', id], 
    queryFn: () => customerService.getById(id), 
    enabled: !!id,
    ...options
  });
};

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateCustomerDto | FormData) => customerService.create(data as any), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }), onError: notifyCapabilityDisabled });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto | FormData }) => customerService.update(id, data as any), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }), onError: notifyCapabilityDisabled });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => customerService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }), onError: notifyCapabilityDisabled });
};

export default useCustomers;
