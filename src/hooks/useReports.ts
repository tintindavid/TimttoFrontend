import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { CreateReportDto } from '@/types/report.types';

export const useReports = (params?: any) => useQuery({ queryKey: ['reports', params], queryFn: () => reportService.getAll(params) });

export const useReport = (id: string) => useQuery({ queryKey: ['reports', id], queryFn: () => reportService.getById(id), enabled: !!id });

export const useCreateReport = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateReportDto) => reportService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }) });
};

export default useReports;
