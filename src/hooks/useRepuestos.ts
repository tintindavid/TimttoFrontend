import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repuestoService } from '@/services/repuesto.service';
import { CreateRepuestoSolicitudDto, InstalarRepuestoDto } from '@/types/repuesto.types';

export const useRepuestosByReporte = (reporteId: string) => {
  return useQuery({
    queryKey: ['repuestos', 'reporte', reporteId],
    queryFn: () => repuestoService.getByReporte(reporteId),
    enabled: !!reporteId,
  });
};

export const useRepuestosByOt = (otId: string) => {
  return useQuery({
    queryKey: ['repuestos', 'ot', otId],
    queryFn: () => repuestoService.getByOt(otId),
    enabled: !!otId,
  });
};

export const useRepuestosByEquipo = (equipoId: string, estado?: string) => {
  return useQuery({
    queryKey: ['repuestos', 'equipo', equipoId, estado],
    queryFn: () => repuestoService.getByEquipo(equipoId, estado),
    enabled: !!equipoId,
  });
};

export const useRepuesto = (id: string) => {
  return useQuery({
    queryKey: ['repuestos', id],
    queryFn: () => repuestoService.getById(id),
    enabled: !!id,
  });
};

export const useCreateRepuestoSolicitud = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      otId, 
      equipoId, 
      data 
    }: { 
      reporteId: string; 
      otId: string; 
      equipoId: string; 
      data: CreateRepuestoSolicitudDto; 
    }) => repuestoService.createSolicitud(reporteId, otId, equipoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repuestos', 'reporte', variables.reporteId] });
      queryClient.invalidateQueries({ queryKey: ['repuestos', 'ot', variables.otId] });
      queryClient.invalidateQueries({ queryKey: ['repuestos', 'equipo', variables.equipoId] });
    },
  });
};

export const useInstalarRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, reporteId }: { data: InstalarRepuestoDto; reporteId: string; }) => 
      repuestoService.instalarRepuesto(data, reporteId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['repuestos', 'reporte', variables.reporteId] });
      if (data?.data?.OrdenId) {
        queryClient.invalidateQueries({ queryKey: ['repuestos', 'ot', data.data.OrdenId] });
      }
      if (data?.data?.EquipoId) {
        queryClient.invalidateQueries({ queryKey: ['repuestos', 'equipo', data.data.EquipoId] });
      }
    },
  });
};

export const useUpdateRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any>; }) => 
      repuestoService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['repuestos'] });
      if (data?.data?._id) {
        queryClient.invalidateQueries({ queryKey: ['repuestos', data.data._id] });
      }
    },
  });
};

export const useDeleteRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: repuestoService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repuestos'] });
    },
  });
};