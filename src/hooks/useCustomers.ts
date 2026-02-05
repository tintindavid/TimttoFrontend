import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, Customer } from '@/types/customer.types';
import { ApiResponse } from '@/types/api.types';

export const useCustomers = (params?: any) => {
  return useQuery<ApiResponse<Customer[]>, Error>({ 
    queryKey: ['customers', params], 
    queryFn: () => customerService.getAll(params) 
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
  return useMutation({ mutationFn: (data: CreateCustomerDto | FormData) => customerService.create(data as any), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto | FormData }) => customerService.update(id, data as any), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) });
};

export const useDeleteCustomer = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => customerService.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) });
};

export default useCustomers;
